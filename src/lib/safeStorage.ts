/**
 * safeStorage
 * A resilient wrapper around localStorage with in-memory fallback when
 * storage is unavailable (e.g., blocked, disabled, private mode).
 */

type MemoryStore = Record<string, string>;

let memoryStore: MemoryStore = {};

function storageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !('localStorage' in window)) return false;
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const hasLocalStorage = storageAvailable();

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (hasLocalStorage) return window.localStorage.getItem(key);
      return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
    } catch {
      return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (hasLocalStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // fall through to memory
    }
    memoryStore[key] = value;
  },
  removeItem(key: string): void {
    try {
      if (hasLocalStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
    delete memoryStore[key];
  },
  clear(): void {
    try {
      if (hasLocalStorage) window.localStorage.clear();
    } catch {
      // ignore
    }
    memoryStore = {};
  },
  isPersistent(): boolean {
    return hasLocalStorage;
  },
};


