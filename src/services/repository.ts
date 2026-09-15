import { AuthSession, AuthorProfile, BackupData, Book, BookStatus, ReaderAccount, Writing, WritingStatus } from '../types';
import * as local from './database';
import { getOrCreateDeviceId } from './device';
import { hasRemoteApi, isNetworkFailure, remoteApi, setAuthFailureHandler, setRemoteSession, uploadLocalImage, type SyncChange } from './remoteApi';

const id = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
async function applyChange(change: SyncChange) {
  if (change.operation === 'delete') {
    if (change.entityType === 'book') await local.deleteBook(change.entityId, false);
    if (change.entityType === 'writing') await local.deleteWriting(change.entityId, false);
    return;
  }
  if (change.entityType === 'author') await local.saveAuthor(change.payload as AuthorProfile, false);
  if (change.entityType === 'book') await local.saveBook(change.payload as Book, false);
  if (change.entityType === 'writing') await local.saveWriting(change.payload as Writing, false);
}

export const repository = {
  async sendAdminOtp(email: string) {
    if (hasRemoteApi) return remoteApi.sendAdminOtp(email);
    throw new Error('The server is not configured. Connect the app to the Diwan API to sign in as author.');
  },
  async verifyAdminOtp(email: string, otp: string): Promise<AuthSession> {
    if (hasRemoteApi) {
      const session = await remoteApi.verifyAdminOtp(email, otp);
      setRemoteSession(session);
      return session;
    }
    throw new Error('The server is not configured. Connect the app to the Diwan API to sign in as author.');
  },
  async readerLogin(username: string, password: string): Promise<AuthSession> {
    if (hasRemoteApi) {
      const session = await remoteApi.readerLogin(username, password);
      setRemoteSession(session);
      return session;
    }
    const readers = await local.getReaders();
    const reader = readers.find(value => value.username.toLowerCase() === username.toLowerCase());
    if (!reader || !reader.password || reader.password !== password) throw new Error('Incorrect username or password.');
    if (reader.status !== 'active') throw new Error('This reader account is inactive.');
    const deviceId = await getOrCreateDeviceId();
    if (reader.deviceId && reader.deviceId !== deviceId) throw Object.assign(new Error('This account is already active on another device.'), { code: 'DEVICE_LOCKED' });
    const updated = { ...reader, deviceId, deviceName: 'Expo Go device', lastLogin: new Date().toISOString() };
    await local.saveReader(updated, false);
    return { role: 'reader', token: `reader-token-${reader.id}-${Date.now()}`, username: reader.username, fullName: reader.fullName, deviceId };
  },
  async readerLogout() { if (hasRemoteApi) await remoteApi.logout(); },
  setSession: setRemoteSession,
  onSessionExpired: setAuthFailureHandler,

  async getAuthor() {
    if (!hasRemoteApi) return local.getAuthor();
    const result = await remoteApi.getAuthor(); await local.saveAuthor(result, false); return result;
  },
  async getBooks() {
    if (!hasRemoteApi) return local.getBooks();
    const result = await remoteApi.getBooks(); for (const book of result) await local.saveBook(book, false); return result;
  },
  async getWritings(bookId?: string) {
    if (!hasRemoteApi) return local.getWritings(bookId);
    const result = bookId
      ? await remoteApi.getWritings(bookId)
      : (await Promise.all((await remoteApi.getBooks()).map(book => remoteApi.getWritings(book.id)))).flat();
    for (const writing of result) await local.saveWriting(writing, false);
    return result;
  },
  async getReaders() {
    if (!hasRemoteApi) return local.getReaders();
    const result = await remoteApi.getReaders(); for (const reader of result) await local.saveReader(reader, false); return result;
  },

  async saveAuthor(updates: Partial<AuthorProfile>) {
    if (hasRemoteApi) {
      try { const result = await remoteApi.updateAuthor(updates); await local.saveAuthor(result, false); return result; }
      catch (error) { if (!isNetworkFailure(error)) throw error; }
    }
    const result = { ...(await local.getAuthor()), ...updates, updatedAt: new Date().toISOString() };
    await local.saveAuthor(result); return result;
  },
  async saveBook(input: Partial<Book> & { id?: string; title: string; status: BookStatus }) {
    if (hasRemoteApi) {
      try { const result = input.id ? await remoteApi.updateBook(input.id, input) : await remoteApi.createBook(input); await local.saveBook(result, false); return result; }
      catch (error) { if (!isNetworkFailure(error)) throw error; }
    }
    const books = await local.getBooks();
    const existing = input.id ? books.find(book => book.id === input.id) : undefined;
    const stamp = new Date().toISOString();
    const result: Book = { id: input.id || id('book'), title: input.title, coverType: input.coverType || existing?.coverType || 'generated', coverUrl: input.coverUrl ?? existing?.coverUrl, coverTheme: input.coverTheme || existing?.coverTheme || 'leather-gold', coverOrnament: input.coverOrnament || existing?.coverOrnament || 'arabesque', status: input.status, orderIndex: existing?.orderIndex ?? books.length, createdAt: existing?.createdAt || stamp, updatedAt: stamp };
    await local.saveBook(result); return result;
  },
  async deleteBook(bookId: string) {
    if (hasRemoteApi) { try { await remoteApi.deleteBook(bookId); await local.deleteBook(bookId, false); return; } catch (error) { if (!isNetworkFailure(error)) throw error; } }
    await local.deleteBook(bookId, true);
  },
  async saveWriting(input: Partial<Writing> & { bookId: string; title: string; content: string; status: WritingStatus }) {
    if (hasRemoteApi) {
      try { const result = input.id ? await remoteApi.updateWriting(input.id, input) : await remoteApi.createWriting(input.bookId, input); await local.saveWriting(result, false); return result; }
      catch (error) { if (!isNetworkFailure(error)) throw error; }
    }
    const writings = await local.getWritings(input.bookId);
    const existing = input.id ? writings.find(writing => writing.id === input.id) : undefined;
    const stamp = new Date().toISOString();
    const result: Writing = { id: input.id || id('writing'), bookId: input.bookId, title: input.title, content: input.content, status: input.status, orderIndex: existing?.orderIndex ?? writings.length, createdAt: existing?.createdAt || stamp, updatedAt: stamp };
    await local.saveWriting(result); return result;
  },
  async deleteWriting(writingId: string) {
    if (hasRemoteApi) { try { await remoteApi.deleteWriting(writingId); await local.deleteWriting(writingId, false); return; } catch (error) { if (!isNetworkFailure(error)) throw error; } }
    await local.deleteWriting(writingId, true);
  },
  async reorderWritings(bookId: string, orderedIds: string[]) {
    if (hasRemoteApi) { try { await remoteApi.reorderWritings(bookId, orderedIds); await local.reorderWritings(bookId, orderedIds, false); return; } catch (error) { if (!isNetworkFailure(error)) throw error; } }
    await local.reorderWritings(bookId, orderedIds, true);
  },
  async createReader(data: { fullName: string; username: string; password: string }) {
    if (hasRemoteApi) { const reader = await remoteApi.createReader(data); await local.saveReader(reader, false); return reader; }
    const readers = await local.getReaders();
    if (readers.some(reader => reader.username.toLowerCase() === data.username.toLowerCase())) throw new Error('This username is already in use.');
    const reader: ReaderAccount = { id: id('reader'), ...data, username: data.username.toLowerCase(), status: 'active', deviceId: null, deviceName: null, lastLogin: null, createdAt: new Date().toISOString() };
    await local.saveReader(reader); return reader;
  },
  async updateReader(readerId: string, updates: Partial<ReaderAccount>) {
    if (hasRemoteApi) { const reader = await remoteApi.updateReader(readerId, updates); await local.saveReader(reader, false); return reader; }
    const current = (await local.getReaders()).find(reader => reader.id === readerId); if (!current) throw new Error('Reader not found.');
    const reader = { ...current, ...updates }; await local.saveReader(reader); return reader;
  },
  async resetReaderDevice(readerId: string) {
    if (hasRemoteApi) { await remoteApi.resetReaderDevice(readerId); const readers = await remoteApi.getReaders(); for (const reader of readers) await local.saveReader(reader, false); return; }
    return repository.updateReader(readerId, { deviceId: null, deviceName: null });
  },
  async deleteReader(readerId: string) { if (hasRemoteApi) await remoteApi.deleteReader(readerId); await local.deleteReader(readerId, !hasRemoteApi); },

  async sync() {
    if (!hasRemoteApi) return;
    const outbox = await local.getOutbox();
    if (outbox.length) {
      const operations = [];
      for (const row of outbox) {
        const payload: any = JSON.parse(row.payload);
        if (row.operation === 'upsert' && row.entityType === 'book' && payload.coverUrl) {
          payload.coverUrl = await uploadLocalImage(payload.coverUrl, 'cover');
          await local.saveBook(payload as Book, false);
        }
        if (row.operation === 'upsert' && row.entityType === 'author' && payload.profileImage) {
          payload.profileImage = await uploadLocalImage(payload.profileImage, 'profile');
          await local.saveAuthor(payload as AuthorProfile, false);
        }
        await local.updateOutboxPayload(row.id, payload);
        operations.push({ ...row, payload });
      }
      const result = await remoteApi.pushOutbox(operations);
      await local.clearOutbox(result.acceptedIds);
    }
    let cursor = Number(await local.getSetting('last_sync_cursor') || 0);
    let more = true;
    while (more) {
      const page = await remoteApi.syncLibrary(cursor);
      for (const change of page.changes) await applyChange(change);
      cursor = page.cursor;
      more = page.hasMore;
      await local.setSetting('last_sync_cursor', String(cursor));
    }
  },
  async exportBackup(): Promise<BackupData> {
    if (hasRemoteApi) return remoteApi.exportBackup();
    const [authorProfile, books, writings, rawReaders] = await Promise.all([local.getAuthor(), local.getBooks(), local.getWritings(), local.getReaders()]);
    const readers = rawReaders.map(({ password: _password, ...reader }) => reader);
    return { version: '2.0', timestamp: new Date().toISOString(), authorProfile, books, writings, readers };
  },
  async restoreBackup(backup: BackupData) {
    if (hasRemoteApi) return remoteApi.restoreBackup(backup);
    return local.restoreSnapshot(backup.authorProfile, backup.books, backup.writings, backup.readers);
  }
};


