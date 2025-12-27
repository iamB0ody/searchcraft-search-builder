import { QueryPayload } from '../../models/platform.model';
import { SearchMode, SearchType } from '../../models/search-form.model';

/**
 * A search history item - recorded when user executes a search
 */
export interface HistoryItem {
  id: string;
  createdAt: string;
  platformId: string;
  searchType: SearchType;
  mode: SearchMode;
  payload: QueryPayload;
  booleanQuery: string;
  url: string;
  operatorCount: number;
}

/**
 * Storage envelope for migration support
 */
export interface HistoryStorageEnvelope {
  schemaVersion: number;
  items: HistoryItem[];
}

/**
 * Input for creating a new history item (without auto-generated fields)
 */
export type HistoryCreateInput = Omit<HistoryItem, 'id' | 'createdAt'>;

/**
 * Maximum number of history items to store
 */
export const MAX_HISTORY_ITEMS = 20;

/**
 * Migrate storage data to current schema version
 */
export function migrateHistoryStorage(data: unknown): HistoryStorageEnvelope {
  if (!data || typeof data !== 'object') {
    return { schemaVersion: 1, items: [] };
  }

  const envelope = data as HistoryStorageEnvelope;

  // Handle missing schemaVersion (legacy data)
  if (!envelope.schemaVersion) {
    return { schemaVersion: 1, items: envelope.items || [] };
  }

  // Future migration logic would go here
  return envelope;
}
