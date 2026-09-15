import * as SecureStore from 'expo-secure-store';
import { AuthSession, ReadingTheme, NastaliqFontId } from '../types';
import { getSetting, removeSetting, setSetting } from './database';

const SESSION_KEY = 'diwan.auth.session.v1';

export async function saveSession(session: AuthSession) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY });
  await removeSetting('session');
}

export async function getSession(): Promise<AuthSession | null> {
  let raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) {
    raw = await getSetting('session');
    if (raw) {
      await SecureStore.setItemAsync(SESSION_KEY, raw, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY });
      await removeSetting('session');
    }
  }
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { await clearSession(); return null; }
}

export async function clearSession() {
  await Promise.all([SecureStore.deleteItemAsync(SESSION_KEY), removeSetting('session')]);
}

export async function getReadingTheme(): Promise<ReadingTheme> { return (await getSetting('reading_theme')) === 'dark' ? 'dark' : 'classic'; }
export async function setReadingTheme(theme: ReadingTheme) { await setSetting('reading_theme', theme); }
export async function getFontPreference(): Promise<NastaliqFontId> {
  const value = await getSetting('font_preference');
  return value === 'jameel' || value === 'mehr' ? value : 'noto';
}
export async function setFontPreference(font: NastaliqFontId) { await setSetting('font_preference', font); }
