declare const process: { env: { EXPO_PUBLIC_API_URL?: string } };
import * as FileSystem from 'expo-file-system/legacy';
import { AuthSession, AuthorProfile, BackupData, Book, ReaderAccount, Writing } from '../types';
import { getOrCreateDeviceId } from './device';
import { clearSession, saveSession } from './session';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_READ_ATTEMPTS = 3;
export const hasRemoteApi = /^https?:\/\//i.test(API_URL);

export class ApiError extends Error {
  constructor(message: string, public status?: number, public code?: string, public requestId?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const isNetworkFailure = (error: unknown) => {
  const value = error as { status?: number; code?: string; name?: string } | undefined;
  return !value?.status || value.code === 'NETWORK_ERROR' || value.name === 'TypeError';
};

let currentSession: AuthSession | null = null;
let authFailureHandler: (() => void | Promise<void>) | null = null;
let sessionUpdateHandler: ((session: AuthSession) => void | Promise<void>) | null = null;
let refreshPromise: Promise<void> | null = null;

export function setRemoteSession(session?: AuthSession | null) { currentSession = session ?? null; }
export function setAuthFailureHandler(handler?: (() => void | Promise<void>) | null) { authFailureHandler = handler ?? null; }
export function setSessionUpdateHandler(handler?: ((session: AuthSession) => void | Promise<void>) | null) { sessionUpdateHandler = handler ?? null; }

const requestId = () => `mobile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
const delay = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));
const parseBody = async (response: Response) => {
  const text = await response.text();
  if (!text) return undefined;
  try { return JSON.parse(text); } catch { return { message: text }; }
};

async function expireSession(message: string): Promise<never> {
  currentSession = null;
  await clearSession();
  await authFailureHandler?.();
  throw new ApiError(message, 401, 'SESSION_EXPIRED');
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    if (!currentSession?.refreshToken) return expireSession('Your session has expired. Please sign in again.');
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Request-ID': requestId() },
      body: JSON.stringify({ refreshToken: currentSession.refreshToken })
    });
    const data = await parseBody(response) || {};
    if (!response.ok) return expireSession(data.error || data.message || 'Your session has expired. Please sign in again.');
    currentSession = data as AuthSession;
    await saveSession(currentSession);
    await sessionUpdateHandler?.(currentSession);
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

async function request<T>(path: string, init: RequestInit = {}, allowRefresh = true, attempt = 1): Promise<T> {
  if (!hasRemoteApi) throw new ApiError('Remote API is not configured. Set EXPO_PUBLIC_API_URL to an HTTP(S) server URL.', undefined, 'API_NOT_CONFIGURED');
  const method = (init.method || 'GET').toUpperCase();
  const canRetry = method === 'GET' || method === 'HEAD';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId(),
        ...(currentSession?.token ? { Authorization: `Bearer ${currentSession.token}` } : {}),
        ...(init.headers || {})
      }
    });
    if (response.status === 401 && allowRefresh && currentSession?.refreshToken) {
      await refreshAccessToken();
      return request<T>(path, init, false, attempt);
    }
    if (response.status === 204) return undefined as T;
    const data = await parseBody(response) || {};
    if (!response.ok) {
      const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      if (canRetry && retryable && attempt < MAX_READ_ATTEMPTS) {
        const retryAfter = Number(response.headers.get('retry-after'));
        await delay(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 5_000) : 300 * (2 ** (attempt - 1)) + Math.random() * 150);
        return request<T>(path, init, allowRefresh, attempt + 1);
      }
      throw new ApiError(data.error || data.message || `Request failed (${response.status})`, response.status, data.code, response.headers.get('x-request-id') || data.requestId);
    }
    return data as T;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      if (canRetry && attempt < MAX_READ_ATTEMPTS) { await delay(300 * (2 ** (attempt - 1))); return request<T>(path, init, allowRefresh, attempt + 1); }
      throw new ApiError('The server request timed out.', undefined, 'NETWORK_ERROR');
    }
    if (canRetry && attempt < MAX_READ_ATTEMPTS && isNetworkFailure(error)) { await delay(300 * (2 ** (attempt - 1))); return request<T>(path, init, allowRefresh, attempt + 1); }
    if (error instanceof ApiError) throw error;
    throw new ApiError('Unable to reach the server. Check your connection and try again.', undefined, 'NETWORK_ERROR');
  } finally { clearTimeout(timer); }
}

export async function uploadLocalImage(uri: string, kind: 'cover' | 'profile') {
  if (!/^(file|content|ph):/i.test(uri)) return uri;
  if (!hasRemoteApi) return uri;
  const extension = uri.split('.').pop()?.toLowerCase().split('?')[0];
  const mimeType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  const send = () => FileSystem.uploadAsync(`${API_URL}/api/media/upload`, uri, {
    httpMethod: 'POST', uploadType: FileSystem.FileSystemUploadType.MULTIPART, fieldName: 'file', mimeType,
    parameters: { kind }, headers: { 'X-Request-ID': requestId(), ...(currentSession?.token ? { Authorization: `Bearer ${currentSession.token}` } : {}) }
  });
  try {
    let response = await send();
    if (response.status === 401 && currentSession?.refreshToken) { await refreshAccessToken(); response = await send(); }
    let body: any = {};
    try { body = JSON.parse(response.body || '{}'); } catch { body = { message: response.body }; }
    if (response.status < 200 || response.status >= 300) throw new ApiError(body.error || body.message || 'Image upload failed.', response.status, body.code);
    if (!body.url) throw new ApiError('The server did not return an image URL.', response.status, 'INVALID_RESPONSE');
    return body.url as string;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Unable to upload the image. Check your connection and try again.', undefined, 'NETWORK_ERROR');
  }
}

const segment = (value: string) => encodeURIComponent(value);
export type SyncChange = { cursor: number; entityType: 'author' | 'book' | 'writing'; entityId: string; operation: 'upsert' | 'delete'; payload: AuthorProfile | Book | Writing | null };
export type OutboxOperation = { id: number; entityType: string; entityId: string; operation: string; payload: unknown; updatedAt: string };

export const remoteApi = {
  health: () => request<{ ok: boolean; database: string; time: string }>('/health'),
  sendAdminOtp: (email: string) => request<{ success: boolean }>('/api/auth/admin/send-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyAdminOtp: (email: string, otp: string) => request<AuthSession>('/api/auth/admin/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  readerLogin: async (username: string, password: string) => request<AuthSession>('/api/auth/reader/login', { method: 'POST', body: JSON.stringify({ username, password, deviceId: await getOrCreateDeviceId(), deviceName: 'Expo mobile device' }) }),
  logout: () => request<{ success: boolean }>('/api/auth/reader/logout', { method: 'POST' }),
  getAuthor: () => request<AuthorProfile>('/api/author'),
  updateAuthor: async (updates: Partial<AuthorProfile>) => request<AuthorProfile>('/api/author', { method: 'PUT', body: JSON.stringify({ ...updates, ...(updates.profileImage ? { profileImage: await uploadLocalImage(updates.profileImage, 'profile') } : {}) }) }),
  getBooks: () => request<Book[]>('/api/books'),
  createBook: async (book: Partial<Book>) => request<Book>('/api/books', { method: 'POST', body: JSON.stringify({ ...book, ...(book.coverUrl ? { coverUrl: await uploadLocalImage(book.coverUrl, 'cover') } : {}) }) }),
  updateBook: async (id: string, book: Partial<Book>) => request<Book>(`/api/books/${segment(id)}`, { method: 'PUT', body: JSON.stringify({ ...book, ...(book.coverUrl ? { coverUrl: await uploadLocalImage(book.coverUrl, 'cover') } : {}) }) }),
  deleteBook: (id: string) => request<void>(`/api/books/${segment(id)}`, { method: 'DELETE' }),
  getWritings: (bookId: string) => request<Writing[]>(`/api/books/${segment(bookId)}/writings`),
  createWriting: (bookId: string, writing: Partial<Writing>) => request<Writing>(`/api/books/${segment(bookId)}/writings`, { method: 'POST', body: JSON.stringify(writing) }),
  updateWriting: (id: string, writing: Partial<Writing>) => request<Writing>(`/api/writings/${segment(id)}`, { method: 'PUT', body: JSON.stringify(writing) }),
  moveWriting: (id: string, destinationBookId: string) => request<Writing>(`/api/writings/${segment(id)}/move`, { method: 'POST', body: JSON.stringify({ bookId: destinationBookId }) }),
  deleteWriting: (id: string) => request<void>(`/api/writings/${segment(id)}`, { method: 'DELETE' }),
  reorderWritings: (bookId: string, orderedIds: string[]) => request<void>(`/api/books/${segment(bookId)}/reorder-writings`, { method: 'PUT', body: JSON.stringify({ orderedIds }) }),
  getReaders: () => request<ReaderAccount[]>('/api/readers'),
  createReader: (reader: { fullName: string; username: string; password: string }) => request<ReaderAccount>('/api/readers', { method: 'POST', body: JSON.stringify(reader) }),
  updateReader: (id: string, updates: Partial<ReaderAccount> & { password?: string }) => request<ReaderAccount>(`/api/readers/${segment(id)}`, { method: 'PUT', body: JSON.stringify(updates) }),
  resetReaderDevice: (id: string) => request<void>(`/api/readers/${segment(id)}/reset-device`, { method: 'POST' }),
  deleteReader: (id: string) => request<void>(`/api/readers/${segment(id)}`, { method: 'DELETE' }),
  pushOutbox: (operations: OutboxOperation[]) => request<{ acceptedIds: number[] }>('/api/sync/push', { method: 'POST', body: JSON.stringify({ operations }) }),
  syncLibrary: (since = 0) => request<{ changes: SyncChange[]; cursor: number; hasMore: boolean }>(`/api/sync?since=${encodeURIComponent(String(Math.max(0, since)))}`),
  exportBackup: () => request<BackupData>('/api/backup/export'),
  restoreBackup: (backup: BackupData) => request<{ success: boolean }>('/api/backup/restore', { method: 'POST', body: JSON.stringify(backup) })
};

