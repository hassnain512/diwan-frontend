export type UserRole = 'admin' | 'reader';
export type BookStatus = 'draft' | 'coming_soon' | 'published';
export type WritingStatus = 'draft' | 'published';
export type ReadingTheme = 'classic' | 'dark';
export type NastaliqFontId = 'noto' | 'jameel' | 'mehr';

export interface AuthorProfile {
  authorName: string;
  authorNameUrdu: string;
  penNameUrdu: string;
  email: string;
  biography: string;
  introduction: string;
  profileImage: string;
  totalBooks?: number;
  totalWritings?: number;
  updatedAt: string;
}

export interface ReaderAccount {
  id: string;
  fullName: string;
  username: string;
  /** Present only in local demo records and never returned by the production API. */
  password?: string;
  status: 'active' | 'inactive';
  deviceId: string | null;
  deviceName?: string | null;
  lastLogin?: string | null;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  coverType: 'generated' | 'custom';
  coverUrl?: string;
  coverTheme?: 'leather-gold' | 'maroon-gold' | 'emerald-gilded' | 'sapphire-silver' | 'noir-cream' | 'terracotta-copper';
  coverOrnament?: 'floral' | 'arabesque' | 'calligraphy' | 'geometric';
  status: BookStatus;
  orderIndex: number;
  writingsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Writing {
  id: string;
  bookId: string;
  title: string;
  content: string;
  status: WritingStatus;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  role: UserRole;
  token: string;
  refreshToken?: string;
  expiresAt?: string;
  username?: string;
  fullName?: string;
  email?: string;
  deviceId?: string;
}

export interface BackupData {
  version: string;
  timestamp: string;
  authorProfile: AuthorProfile;
  books: Book[];
  writings: Writing[];
  readers: ReaderAccount[];
}

export interface OfflineSnapshot {
  books: Book[];
  writings: Writing[];
  author: AuthorProfile | null;
  readers: ReaderAccount[];
  lastSync: number;
}
