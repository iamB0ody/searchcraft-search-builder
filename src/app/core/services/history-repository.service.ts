import { Injectable, inject } from '@angular/core';
import { LocalStorageAdapter } from '../storage/local-storage.adapter';
import { generateUUID } from '../models/preset.model';
import {
  HistoryItem,
  HistoryStorageEnvelope,
  HistoryCreateInput,
  MAX_HISTORY_ITEMS,
  HISTORY_SCHEMA_VERSION,
  migrateHistoryStorage
} from '../models/history-item.model';

/**
 * Repository service for managing search history in storage
 * Implements FIFO with max item limit
 */
@Injectable({ providedIn: 'root' })
export class HistoryRepositoryService {
  private readonly STORAGE_KEY = 'searchcraft_history';
  private readonly storage = inject(LocalStorageAdapter);

  /**
   * Add a new history item
   * Enforces FIFO with max limit - oldest items are removed first
   */
  add(input: HistoryCreateInput): HistoryItem {
    const newItem: HistoryItem = {
      ...input,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    };

    const envelope = this.loadEnvelope();

    // Add new item at the beginning (most recent first)
    envelope.items.unshift(newItem);

    // Enforce max limit - remove oldest items (from the end)
    if (envelope.items.length > MAX_HISTORY_ITEMS) {
      envelope.items = envelope.items.slice(0, MAX_HISTORY_ITEMS);
    }

    this.saveEnvelope(envelope);

    return newItem;
  }

  /**
   * List all history items, sorted by createdAt descending (most recent first)
   */
  list(): HistoryItem[] {
    const envelope = this.loadEnvelope();
    return [...envelope.items].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get a history item by ID
   */
  getById(id: string): HistoryItem | undefined {
    const envelope = this.loadEnvelope();
    return envelope.items.find(item => item.id === id);
  }

  /**
   * Delete a history item by ID
   */
  delete(id: string): boolean {
    const envelope = this.loadEnvelope();
    const index = envelope.items.findIndex(item => item.id === id);

    if (index === -1) {
      return false;
    }

    envelope.items.splice(index, 1);
    this.saveEnvelope(envelope);

    return true;
  }

  /**
   * Search history items by keyword
   * Searches in booleanQuery, url, titles, and skills
   */
  search(query: string): HistoryItem[] {
    const lower = query.toLowerCase().trim();
    if (!lower) {
      return this.list();
    }

    return this.list().filter(item =>
      item.booleanQuery.toLowerCase().includes(lower) ||
      item.url.toLowerCase().includes(lower) ||
      item.payload.titles?.some(t => t.toLowerCase().includes(lower)) ||
      item.payload.skills?.some(s => s.toLowerCase().includes(lower)) ||
      item.payload.exclude?.some(e => e.toLowerCase().includes(lower)) ||
      item.payload.location?.toLowerCase().includes(lower)
    );
  }

  /**
   * Get count of history items
   */
  count(): number {
    return this.loadEnvelope().items.length;
  }

  /**
   * Clear all history items
   */
  clearAll(): void {
    this.saveEnvelope({ schemaVersion: HISTORY_SCHEMA_VERSION, items: [] });
  }

  private loadEnvelope(): HistoryStorageEnvelope {
    const raw = this.storage.get(this.STORAGE_KEY);

    if (!raw) {
      return { schemaVersion: 1, items: [] };
    }

    try {
      const data = JSON.parse(raw);
      return migrateHistoryStorage(data);
    } catch {
      // Corrupted storage, reset
      console.warn('Corrupted history storage, resetting');
      return { schemaVersion: 1, items: [] };
    }
  }

  private saveEnvelope(envelope: HistoryStorageEnvelope): void {
    this.storage.set(this.STORAGE_KEY, JSON.stringify(envelope));
  }
}
