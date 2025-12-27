/**
 * Abstract storage adapter interface
 * Allows swapping storage implementations (localStorage, sessionStorage, IndexedDB, server, etc.)
 */
export interface StorageAdapter {
  /**
   * Get a value by key
   */
  get(key: string): string | null;

  /**
   * Set a value by key
   */
  set(key: string, value: string): void;

  /**
   * Remove a value by key
   */
  remove(key: string): void;
}
