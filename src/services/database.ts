import * as SQLite from 'expo-sqlite';
import { seedAuthor, seedBooks, seedReaders, seedWritings } from '../data';
import { AuthorProfile, Book, ReaderAccount, Writing } from '../types';
import { decryptLocalJson, decryptLocalValue, encryptLocalJson, encryptLocalValue, isEncryptedLocalValue } from './localEncryption';

declare const process: { env: { EXPO_PUBLIC_API_URL?: string } };

let dbPromise: ReturnType<typeof SQLite.openDatabaseAsync> | null = null;
const db = () => (dbPromise ??= SQLite.openDatabaseAsync('diwan.db'));

async function migrateSensitiveRows(database: Awaited<ReturnType<typeof SQLite.openDatabaseAsync>>) {
  const migrated = await database.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key='local_encryption_v1_migrated'");
  if (migrated?.value === '1') return;

  const targets = [
    { table: 'author', id: 'id', column: 'json' },
    { table: 'books', id: 'id', column: 'json' },
    { table: 'writings', id: 'id', column: 'json' },
    { table: 'readers', id: 'id', column: 'json' },
    { table: 'outbox', id: 'id', column: 'payload' }
  ] as const;

  await database.withTransactionAsync(async () => {
    for (const target of targets) {
      const rows = await database.getAllAsync<Record<string, string | number>>(
        `SELECT ${target.id} AS rowId, ${target.column} AS privateValue FROM ${target.table}`
      );
      for (const row of rows) {
        const privateValue = String(row.privateValue ?? '');
        if (!privateValue || isEncryptedLocalValue(privateValue)) continue;
        const encrypted = await encryptLocalValue(privateValue);
        await database.runAsync(
          `UPDATE ${target.table} SET ${target.column}=? WHERE ${target.id}=?`,
          encrypted,
          row.rowId
        );
      }
    }
    await database.runAsync(
      'INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)',
      'local_encryption_v1_migrated',
      '1'
    );
  });
}

export async function initializeDatabase() {
  const database = await db();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS author (id INTEGER PRIMARY KEY CHECK (id = 1), json TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS books (id TEXT PRIMARY KEY NOT NULL, json TEXT NOT NULL, status TEXT NOT NULL, orderIndex INTEGER NOT NULL, updatedAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS writings (id TEXT PRIMARY KEY NOT NULL, bookId TEXT NOT NULL, json TEXT NOT NULL, status TEXT NOT NULL, orderIndex INTEGER NOT NULL, updatedAt TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_writings_book ON writings(bookId, orderIndex);
    CREATE TABLE IF NOT EXISTS readers (id TEXT PRIMARY KEY NOT NULL, username TEXT UNIQUE NOT NULL, json TEXT NOT NULL, status TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, entityType TEXT NOT NULL, entityId TEXT NOT NULL, operation TEXT NOT NULL, payload TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_outbox_entity ON outbox(entityType, entityId);
  `);

  await migrateSensitiveRows(database);

  const demoMode = !(process.env.EXPO_PUBLIC_API_URL || '').trim();
  const intendedMode = demoMode ? 'demo' : 'remote';
  const previousMode = await getSetting('storage_mode');
  const existingSeed = await getSetting('seeded');
  const modeChanged = (previousMode !== null && previousMode !== intendedMode) || (!previousMode && !demoMode && Boolean(existingSeed));
  if (modeChanged) {
    await database.withTransactionAsync(async () => {
      await database.execAsync('DELETE FROM books; DELETE FROM writings; DELETE FROM readers; DELETE FROM author; DELETE FROM outbox;');
      await database.runAsync('DELETE FROM settings WHERE key IN (?,?,?,?)', 'seeded', 'last_sync', 'last_sync_cursor', 'session');
    });
  }
  await setSetting('storage_mode', intendedMode);
  const seeded = await getSetting('seeded');
  if (!seeded && demoMode) {
    await database.withTransactionAsync(async () => {
      await database.runAsync('INSERT OR REPLACE INTO author (id,json,updatedAt) VALUES (1,?,?)', await encryptLocalJson(seedAuthor), seedAuthor.updatedAt);
      for (const book of seedBooks) {
        await database.runAsync('INSERT OR REPLACE INTO books (id,json,status,orderIndex,updatedAt) VALUES (?,?,?,?,?)', book.id, await encryptLocalJson(book), book.status, book.orderIndex, book.updatedAt);
      }
      for (const writing of seedWritings) {
        await database.runAsync('INSERT OR REPLACE INTO writings (id,bookId,json,status,orderIndex,updatedAt) VALUES (?,?,?,?,?,?)', writing.id, writing.bookId, await encryptLocalJson(writing), writing.status, writing.orderIndex, writing.updatedAt);
      }
      for (const reader of seedReaders) {
        await database.runAsync('INSERT OR IGNORE INTO readers (id,username,json,status,updatedAt) VALUES (?,?,?,?,?)', reader.id, reader.username, await encryptLocalJson(reader), reader.status, reader.createdAt);
      }
      await database.runAsync('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)', 'seeded', '1');
    });
  }
  return modeChanged;
}

export async function getSetting(key: string): Promise<string | null> {
  const database = await db();
  const row = await database.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key=?', key);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const database = await db();
  await database.runAsync('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)', key, value);
}

export async function removeSetting(key: string) {
  const database = await db();
  await database.runAsync('DELETE FROM settings WHERE key=?', key);
}

export async function getAuthor(): Promise<AuthorProfile> {
  const database = await db();
  const row = await database.getFirstAsync<{ json: string }>('SELECT json FROM author WHERE id=1');
  return row ? decryptLocalJson<AuthorProfile>(row.json) : seedAuthor;
}

export async function saveAuthor(author: AuthorProfile, queue = true) {
  const database = await db();
  await database.runAsync('INSERT OR REPLACE INTO author (id,json,updatedAt) VALUES (1,?,?)', await encryptLocalJson(author), author.updatedAt);
  if (queue) await enqueue('author', 'author', 'upsert', author, author.updatedAt);
}

export async function getBooks(): Promise<Book[]> {
  const database = await db();
  const rows = await database.getAllAsync<{ json: string }>('SELECT json FROM books ORDER BY orderIndex ASC');
  return Promise.all(rows.map(r => decryptLocalJson<Book>(r.json)));
}

export async function saveBook(book: Book, queue = true) {
  const database = await db();
  await database.runAsync('INSERT OR REPLACE INTO books (id,json,status,orderIndex,updatedAt) VALUES (?,?,?,?,?)', book.id, await encryptLocalJson(book), book.status, book.orderIndex, book.updatedAt);
  if (queue) await enqueue('book', book.id, 'upsert', book, book.updatedAt);
}

export async function deleteBook(id: string, queue = true) {
  const database = await db();
  const timestamp = new Date().toISOString();
  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM writings WHERE bookId=?', id);
    await database.runAsync('DELETE FROM books WHERE id=?', id);
  });
  if (queue) await enqueue('book', id, 'delete', { id }, timestamp);
}

export async function getWritings(bookId?: string): Promise<Writing[]> {
  const database = await db();
  const rows = bookId
    ? await database.getAllAsync<{ json: string }>('SELECT json FROM writings WHERE bookId=? ORDER BY orderIndex ASC', bookId)
    : await database.getAllAsync<{ json: string }>('SELECT json FROM writings ORDER BY bookId, orderIndex ASC');
  return Promise.all(rows.map(r => decryptLocalJson<Writing>(r.json)));
}

export async function saveWriting(writing: Writing, queue = true) {
  const database = await db();
  await database.runAsync('INSERT OR REPLACE INTO writings (id,bookId,json,status,orderIndex,updatedAt) VALUES (?,?,?,?,?,?)', writing.id, writing.bookId, await encryptLocalJson(writing), writing.status, writing.orderIndex, writing.updatedAt);
  if (queue) await enqueue('writing', writing.id, 'upsert', writing, writing.updatedAt);
}

export async function deleteWriting(id: string, queue = true) {
  const database = await db();
  const timestamp = new Date().toISOString();
  await database.runAsync('DELETE FROM writings WHERE id=?', id);
  if (queue) await enqueue('writing', id, 'delete', { id }, timestamp);
}

export async function moveWriting(id: string, destinationBookId: string, queue = true): Promise<Writing> {
  const database = await db();
  const all = await getWritings();
  const current = all.find(writing => writing.id === id);
  if (!current) throw new Error('Poem not found.');
  if (current.bookId === destinationBookId) return current;
  if (!(await getBooks()).some(book => book.id === destinationBookId)) throw new Error('Destination collection not found.');

  const source = all.filter(writing => writing.bookId === current.bookId && writing.id !== id).sort((a, b) => a.orderIndex - b.orderIndex);
  const destination = all.filter(writing => writing.bookId === destinationBookId && writing.id !== id).sort((a, b) => a.orderIndex - b.orderIndex);
  const stamp = new Date().toISOString();
  const moved: Writing = { ...current, bookId: destinationBookId, orderIndex: destination.length, updatedAt: stamp };
  const updates = [
    ...source.map((writing, orderIndex) => ({ ...writing, orderIndex, updatedAt: stamp })),
    ...destination.map((writing, orderIndex) => ({ ...writing, orderIndex, updatedAt: stamp })),
    moved
  ];

  await database.withTransactionAsync(async () => {
    for (const writing of updates) {
      await database.runAsync('INSERT OR REPLACE INTO writings (id,bookId,json,status,orderIndex,updatedAt) VALUES (?,?,?,?,?,?)', writing.id, writing.bookId, await encryptLocalJson(writing), writing.status, writing.orderIndex, writing.updatedAt);
      if (queue) await enqueue('writing', writing.id, 'upsert', writing, writing.updatedAt);
    }
  });
  return moved;
}

export async function reorderWritings(bookId: string, orderedIds: string[], queue = true) {
  const database = await db();
  const current = await getWritings(bookId);
  await database.withTransactionAsync(async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      const w = current.find(x => x.id === orderedIds[i]);
      if (!w) continue;
      const updated = { ...w, orderIndex: i, updatedAt: new Date().toISOString() };
      await database.runAsync('UPDATE writings SET json=?, orderIndex=?, updatedAt=? WHERE id=?', await encryptLocalJson(updated), i, updated.updatedAt, updated.id);
      if (queue) await enqueue('writing', updated.id, 'upsert', updated, updated.updatedAt);
    }
  });
}

export async function getReaders(): Promise<ReaderAccount[]> {
  const database = await db();
  const rows = await database.getAllAsync<{ json: string }>('SELECT json FROM readers ORDER BY rowid ASC');
  return Promise.all(rows.map(r => decryptLocalJson<ReaderAccount>(r.json)));
}

export async function saveReader(reader: ReaderAccount, queue = true) {
  const database = await db();
  await database.runAsync('INSERT OR REPLACE INTO readers (id,username,json,status,updatedAt) VALUES (?,?,?,?,?)', reader.id, reader.username, await encryptLocalJson(reader), reader.status, new Date().toISOString());
  if (queue) await enqueue('reader', reader.id, 'upsert', reader, new Date().toISOString());
}

export async function deleteReader(id: string, queue = true) {
  const database = await db();
  const timestamp = new Date().toISOString();
  await database.runAsync('DELETE FROM readers WHERE id=?', id);
  if (queue) await enqueue('reader', id, 'delete', { id }, timestamp);
}

export async function enqueue(entityType: string, entityId: string, operation: string, payload: unknown, updatedAt: string) {
  const database = await db();
  await database.runAsync('DELETE FROM outbox WHERE entityType=? AND entityId=?', entityType, entityId);
  await database.runAsync('INSERT INTO outbox (entityType,entityId,operation,payload,updatedAt) VALUES (?,?,?,?,?)', entityType, entityId, operation, await encryptLocalJson(payload), updatedAt);
}

export async function getOutbox() {
  const database = await db();
  const rows = await database.getAllAsync<{ id: number; entityType: string; entityId: string; operation: string; payload: string; updatedAt: string }>('SELECT * FROM outbox ORDER BY id ASC');
  return Promise.all(rows.map(async row => ({ ...row, payload: await decryptLocalValue(row.payload) })));
}

export async function updateOutboxPayload(id: number, payload: unknown) {
  const database = await db();
  await database.runAsync('UPDATE outbox SET payload=? WHERE id=?', await encryptLocalJson(payload), id);
}
export async function clearOutbox(ids: number[]) {
  if (!ids.length) return;
  const database = await db();
  const marks = ids.map(() => '?').join(',');
  await database.runAsync(`DELETE FROM outbox WHERE id IN (${marks})`, ...ids);
}

export async function clearReaderOfflineContent() {
  const database = await db();
  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM books');
    await database.runAsync('DELETE FROM writings');
    await database.runAsync('DELETE FROM author');
    await database.runAsync('DELETE FROM outbox');
    await database.runAsync('DELETE FROM settings WHERE key IN (?,?,?,?)', 'last_sync', 'last_sync_cursor', 'session', 'seeded');
  });
}

export async function clearRemoteCache() {
  const database = await db();
  await database.withTransactionAsync(async () => {
    await database.execAsync('DELETE FROM books; DELETE FROM writings; DELETE FROM readers; DELETE FROM author; DELETE FROM outbox;');
    await database.runAsync('DELETE FROM settings WHERE key IN (?,?)', 'last_sync', 'last_sync_cursor');
  });
}
export async function restoreSnapshot(author: AuthorProfile, books: Book[], writings: Writing[], readers: ReaderAccount[]) {
  const database = await db();
  await database.withTransactionAsync(async () => {
    await database.execAsync('DELETE FROM books; DELETE FROM writings; DELETE FROM readers; DELETE FROM author; DELETE FROM outbox;');
    await database.runAsync('INSERT INTO author (id,json,updatedAt) VALUES (1,?,?)', await encryptLocalJson(author), author.updatedAt);
    for (const book of books) await database.runAsync('INSERT INTO books (id,json,status,orderIndex,updatedAt) VALUES (?,?,?,?,?)', book.id, await encryptLocalJson(book), book.status, book.orderIndex, book.updatedAt);
    for (const writing of writings) await database.runAsync('INSERT INTO writings (id,bookId,json,status,orderIndex,updatedAt) VALUES (?,?,?,?,?,?)', writing.id, writing.bookId, await encryptLocalJson(writing), writing.status, writing.orderIndex, writing.updatedAt);
    for (const reader of readers) await database.runAsync('INSERT INTO readers (id,username,json,status,updatedAt) VALUES (?,?,?,?,?)', reader.id, reader.username, await encryptLocalJson(reader), reader.status, reader.createdAt);
  });
}
