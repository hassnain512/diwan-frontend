import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Network from 'expo-network';
import { AuthSession, AuthorProfile, Book, BookStatus, NastaliqFontId, ReaderAccount, ReadingTheme, Writing, WritingStatus } from '../types';
import { clearReaderOfflineContent, clearRemoteCache, getAuthor, getBooks, getReaders, getWritings, initializeDatabase } from '../services/database';
import { repository } from '../services/repository';
import { hasRemoteApi, isNetworkFailure } from '../services/remoteApi';
import { clearSession, getFontPreference, getReadingTheme, getSession, saveSession, setFontPreference, setReadingTheme } from '../services/session';

interface AppContextValue {
  ready: boolean;
  session: AuthSession | null;
  author: AuthorProfile | null;
  books: Book[];
  writings: Writing[];
  readers: ReaderAccount[];
  online: boolean;
  syncing: boolean;
  readingTheme: ReadingTheme;
  fontId: NastaliqFontId;
  loginReader(username: string, password: string): Promise<void>;
  sendAdminOtp(email: string): Promise<void>;
  verifyAdminOtp(email: string, otp: string): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  sync(): Promise<void>;
  saveBook(data: Partial<Book> & { title: string; status: BookStatus }): Promise<Book>;
  removeBook(id: string): Promise<void>;
  saveWriting(data: Partial<Writing> & { bookId: string; title: string; content: string; status: WritingStatus }): Promise<Writing>;
  moveWriting(id: string, destinationBookId: string): Promise<Writing>;
  removeWriting(id: string): Promise<void>;
  reorderWritings(bookId: string, orderedIds: string[]): Promise<void>;
  saveAuthor(data: Partial<AuthorProfile>): Promise<void>;
  createReader(data: { fullName: string; username: string; password: string }): Promise<void>;
  updateReader(id: string, data: Partial<ReaderAccount>): Promise<void>;
  resetReaderDevice(id: string): Promise<void>;
  removeReader(id: string): Promise<void>;
  setTheme(theme: ReadingTheme): Promise<void>;
  setFont(font: NastaliqFontId): Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [writings, setWritings] = useState<Writing[]>([]);
  const [readers, setReaders] = useState<ReaderAccount[]>([]);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [readingTheme, setReadingThemeState] = useState<ReadingTheme>('classic');
  const [fontId, setFontId] = useState<NastaliqFontId>('noto');

  const loadLocal = useCallback(async (role?: 'admin' | 'reader') => {
    const [localAuthor, localBooks, localWritings] = await Promise.all([getAuthor().catch(() => null), getBooks(), getWritings()]);
    setAuthor(localAuthor);
    setBooks(localBooks);
    setWritings(localWritings);
    if (role === 'admin') setReaders(await getReaders());
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const [remoteAuthor, remoteBooks, remoteWritings] = await Promise.all([repository.getAuthor(), repository.getBooks(), repository.getWritings()]);
      setAuthor(remoteAuthor);
      setBooks(remoteBooks);
      setWritings(remoteWritings);
      if (session.role === 'admin') setReaders(await repository.getReaders());
    } catch (error: any) {
      if (error?.code === 'SESSION_EXPIRED') return;
      await loadLocal(session.role);
    }
  }, [session, loadLocal]);

  const sync = useCallback(async () => {
    if (!session || !online || syncing) return;
    setSyncing(true);
    try {
      await repository.sync();
      await refresh();
    } finally {
      setSyncing(false);
    }
  }, [session, online, syncing, refresh]);

  useEffect(() => {
    repository.onSessionExpired(async () => {
      await clearRemoteCache();
      setSessionState(null); setAuthor(null); setBooks([]); setWritings([]); setReaders([]);
    });
    (async () => {
      const storageModeChanged = await initializeDatabase();
      if (storageModeChanged) await clearSession();
      const [savedSession, theme, font, network] = await Promise.all([getSession(), getReadingTheme(), getFontPreference(), Network.getNetworkStateAsync()]);
      setSessionState(savedSession);
      if (savedSession) repository.setSession(savedSession);
      setReadingThemeState(theme);
      setFontId(font);
      setOnline(Boolean(network.isConnected && network.isInternetReachable !== false));
      if (savedSession) await loadLocal(savedSession.role);
      setReady(true);
    })();

    const sub = Network.addNetworkStateListener(state => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
    return () => { repository.onSessionExpired(); sub.remove(); };
  }, [loadLocal]);

  useEffect(() => {
    if (ready && session && online) sync().catch(() => undefined);
  }, [online, ready, session?.token]);

  const loginReader = async (username: string, password: string) => {
    const next = await repository.readerLogin(username, password);
    await initializeDatabase();
    await saveSession(next); setSessionState(next); repository.setSession(next); await loadLocal('reader'); await refresh();
  };
  const sendAdminOtp = async (email: string) => { await repository.sendAdminOtp(email); };
  const verifyAdminOtp = async (email: string, otp: string) => {
    const next = await repository.verifyAdminOtp(email, otp);
    await initializeDatabase();
    await saveSession(next); setSessionState(next); repository.setSession(next); await loadLocal('admin'); await refresh();
  };
  const logout = async () => {
    if (session && hasRemoteApi) { try { await repository.readerLogout(); } catch {} }
    await clearSession();
    if (hasRemoteApi) await clearRemoteCache();
    else if (session?.role === 'reader') await clearReaderOfflineContent();
    repository.setSession(); setSessionState(null); setAuthor(null); setBooks([]); setWritings([]); setReaders([]);
  };

  const actions = useMemo(() => ({
    async saveBook(data: Partial<Book> & { title: string; status: BookStatus }) { const result = await repository.saveBook(data); await refresh(); return result; },
    async removeBook(id: string) { await repository.deleteBook(id); await refresh(); },
    async saveWriting(data: Partial<Writing> & { bookId: string; title: string; content: string; status: WritingStatus }) { const result = await repository.saveWriting(data); await refresh(); return result; },
    async moveWriting(id: string, destinationBookId: string) { const result = await repository.moveWriting(id, destinationBookId); await refresh(); return result; },
    async removeWriting(id: string) { await repository.deleteWriting(id); await refresh(); },
    async reorderWritings(bookId: string, ids: string[]) { await repository.reorderWritings(bookId, ids); await refresh(); },
    async saveAuthor(data: Partial<AuthorProfile>) { await repository.saveAuthor(data); await refresh(); },
    async createReader(data: { fullName: string; username: string; password: string }) { await repository.createReader(data); await refresh(); },
    async updateReader(id: string, data: Partial<ReaderAccount>) { await repository.updateReader(id, data); await refresh(); },
    async resetReaderDevice(id: string) { await repository.resetReaderDevice(id); await refresh(); },
    async removeReader(id: string) { await repository.deleteReader(id); await refresh(); },
    async setTheme(theme: ReadingTheme) { await setReadingTheme(theme); setReadingThemeState(theme); },
    async setFont(font: NastaliqFontId) { await setFontPreference(font); setFontId(font); }
  }), [refresh]);

  const value: AppContextValue = { ready, session, author, books, writings, readers, online, syncing, readingTheme, fontId, loginReader, sendAdminOtp, verifyAdminOtp, logout, refresh, sync, ...actions };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}

