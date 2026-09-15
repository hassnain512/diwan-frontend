import * as SecureStore from 'expo-secure-store';
import { getSetting, removeSetting } from './database';

const DEVICE_KEY = 'diwan.device.id.v1';

export async function getOrCreateDeviceId() {
  let id = await SecureStore.getItemAsync(DEVICE_KEY);
  if (!id) {
    id = await getSetting('device_id');
    if (!id) id = `dev_${Date.now().toString(36)}_${Array.from({ length: 4 }, () => Math.random().toString(36).slice(2)).join('')}`;
    await SecureStore.setItemAsync(DEVICE_KEY, id, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY });
    await removeSetting('device_id');
  }
  return id;
}
