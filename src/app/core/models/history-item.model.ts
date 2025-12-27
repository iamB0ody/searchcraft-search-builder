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
 * Current schema version for history
 */
export const HISTORY_SCHEMA_VERSION = 2;

/**
 * Migrate storage data to current schema version
 */
export function migrateHistoryStorage(data: unknown): HistoryStorageEnvelope {
  if (!data || typeof data !== 'object') {
    return { schemaVersion: HISTORY_SCHEMA_VERSION, items: [] };
  }

  const envelope = data as HistoryStorageEnvelope;

  // Handle missing schemaVersion (legacy data)
  if (!envelope.schemaVersion) {
    envelope.schemaVersion = 1;
    envelope.items = envelope.items || [];
  }

  // Migrate v1 → v2: rename platformId 'google' to 'google-jobs'
  if (envelope.schemaVersion === 1) {
    envelope.items = envelope.items.map(item => ({
      ...item,
      platformId: item.platformId === 'google' ? 'google-jobs' : item.platformId
    }));
    envelope.schemaVersion = 2;
  }

  return envelope;
}
