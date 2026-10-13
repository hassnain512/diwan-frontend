import * as SecureStore from 'expo-secure-store';
import {
  AESEncryptionKey,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync
} from 'expo-crypto';

const KEY_NAME = 'diwan.local-encryption-key.v1';
const PREFIX = 'enc:v1:';

let keyPromise: Promise<AESEncryptionKey> | null = null;

async function getEncryptionKey() {
  if (!keyPromise) {
    keyPromise = (async () => {
      const stored = await SecureStore.getItemAsync(KEY_NAME);
      if (stored) return (await AESEncryptionKey.import(stored, 'hex')) as AESEncryptionKey;

      const generated = (await AESEncryptionKey.generate()) as AESEncryptionKey;
      const encoded = await generated.encoded('hex');
      await SecureStore.setItemAsync(KEY_NAME, encoded);
      return generated;
    })();
  }
  return keyPromise;
}

export function isEncryptedLocalValue(value: string) {
  return value.startsWith(PREFIX);
}

export async function encryptLocalValue(value: string) {
  if (isEncryptedLocalValue(value)) return value;
  const key = await getEncryptionKey();
  const plaintext = new TextEncoder().encode(value);
  const sealed = await aesEncryptAsync(plaintext, key);
  const combined = await sealed.combined('base64');
  return `${PREFIX}${combined}`;
}

export async function decryptLocalValue(value: string) {
  if (!isEncryptedLocalValue(value)) return value;
  try {
    const key = await getEncryptionKey();
    const sealed = AESSealedData.fromCombined(value.slice(PREFIX.length));
    const plaintext = await aesDecryptAsync(sealed, key, { output: 'bytes' });
    return new TextDecoder().decode(plaintext as Uint8Array);
  } catch {
    throw new Error('Private local data could not be unlocked on this device.');
  }
}

export async function encryptLocalJson(value: unknown) {
  return encryptLocalValue(JSON.stringify(value));
}

export async function decryptLocalJson<T>(value: string): Promise<T> {
  return JSON.parse(await decryptLocalValue(value)) as T;
}
