// Safe storage helper with in-memory fallback for sandboxed iframes
const memoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Storage restricted (e.g. cross-origin iframe security policies)
    }
    return memoryStore[key] ?? null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Storage restricted
    }
    memoryStore[key] = value;
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Storage restricted
    }
    delete memoryStore[key];
  },
};
