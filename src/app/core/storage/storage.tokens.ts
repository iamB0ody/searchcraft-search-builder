import { InjectionToken } from '@angular/core';
import { StorageAdapter } from './storage-adapter';

/**
 * Injection token for the storage adapter
 * Allows swapping storage implementations via DI
 *
 * Usage:
 * ```typescript
 * providers: [
 *   { provide: STORAGE_ADAPTER, useClass: LocalStorageAdapter }
 * ]
 * ```
 */
export const STORAGE_ADAPTER = new InjectionToken<StorageAdapter>('StorageAdapter');
