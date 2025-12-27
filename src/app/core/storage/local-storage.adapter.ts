import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { StorageAdapter } from './storage-adapter';

/**
 * SSR-safe localStorage adapter
 * Falls back to in-memory storage when not in browser environment
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageAdapter implements StorageAdapter {
  private readonly isBrowser: boolean;
  private readonly memoryStore = new Map<string, string>();

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  get(key: string): string | null {
    if (this.isBrowser) {
      try {
        return localStorage.getItem(key);
      } catch {
        // localStorage may be disabled or quota exceeded
        return this.memoryStore.get(key) ?? null;
      }
    }
    // SSR: use memory store
    return this.memoryStore.get(key) ?? null;
  }

  set(key: string, value: string): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem(key, value);
        return;
      } catch (e) {
        // Quota exceeded or localStorage disabled
        console.warn('localStorage unavailable, using memory store:', e);
      }
    }
    // Fallback to memory store
    this.memoryStore.set(key, value);
  }

  remove(key: string): void {
    if (this.isBrowser) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore errors
      }
    }
    this.memoryStore.delete(key);
  }

  /**
   * Clear all stored data (useful for testing)
   */
  clear(): void {
    if (this.isBrowser) {
      try {
        localStorage.clear();
      } catch {
        // Ignore errors
      }
    }
    this.memoryStore.clear();
  }
}
