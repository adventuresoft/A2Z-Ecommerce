import type { StateStorage } from 'zustand/middleware';

export interface SyncKeyValueStorage {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string | number | boolean) => void;
  remove: (key: string) => void;
  clearAll: () => void;
}

class MemoryFallbackStorage implements SyncKeyValueStorage {
  private readonly map = new Map<string, string>();
  getString(key: string) {
    return this.map.get(key);
  }
  set(key: string, value: string | number | boolean) {
    this.map.set(key, String(value));
  }
  remove(key: string) {
    this.map.delete(key);
  }
  clearAll() {
    this.map.clear();
  }
}

function createStoreInstance(id: string): SyncKeyValueStorage {
  // Use in-memory fallback under Jest/Node where Nitro native runtime isn't loaded
  if (typeof process !== 'undefined' && process.env?.JEST_WORKER_ID) {
    return new MemoryFallbackStorage();
  }
  try {
    // react-native-mmkv v4 factory API (`createMMKV`)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mmkvMod = require('react-native-mmkv') as {
      createMMKV?: (config: { id: string }) => {
        getString: (key: string) => string | undefined;
        set: (key: string, value: string | number | boolean) => void;
        remove: (key: string) => void;
        clearAll: () => void;
      };
    };
    if (typeof mmkvMod.createMMKV === 'function') {
      const instance = mmkvMod.createMMKV({ id });
      return {
        getString: (k) => instance.getString(k),
        set: (k, v) => instance.set(k, v),
        remove: (k) => instance.remove(k),
        clearAll: () => instance.clearAll(),
      };
    }
  } catch {
    // Graceful fallback when native module is unavailable
  }
  return new MemoryFallbackStorage();
}

/**
 * Non-sensitive persistent app state storage (Cart, preferences, recent searches).
 * NEVER store refresh tokens or passwords here; use `secure-store.ts`.
 */
export const appStorage: SyncKeyValueStorage = createStoreInstance('az-ecommerce-app');

/**
 * Dedicated MMKV instance for TanStack Query persisted cache (categories, locations, curated).
 */
export const queryCacheStorage: SyncKeyValueStorage = createStoreInstance('az-ecommerce-query-cache');

export const mmkvStateStorage: StateStorage = {
  getItem: (name: string) => appStorage.getString(name) ?? null,
  setItem: (name: string, value: string) => {
    appStorage.set(name, value);
  },
  removeItem: (name: string) => {
    appStorage.remove(name);
  },
};
