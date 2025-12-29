import { QueryPayload } from '../../models/platform.model';
import { SearchMode, SearchType } from '../../models/search-form.model';
import { EmotionalSearchMode } from '../../models/emotional-mode.model';
import { HiringSignalsState } from '../people-signals/hiring-signals.model';

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
  emotionalMode?: EmotionalSearchMode;  // Emotional search mode (defaults to 'normal')
  hiringSignals?: HiringSignalsState;   // Hiring signals state (People search only)
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
export const HISTORY_SCHEMA_VERSION = 7;

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

  // Migrate v2 → v3: add fallback for unknown platformIds (new MENA platforms)
  if (envelope.schemaVersion === 2) {
    const knownPlatforms = [
      'linkedin', 'salesnav', 'google-jobs', 'indeed',
      'bayt', 'gulftalent', 'naukrigulf', 'recruitnet', 'bebee', 'gulfjobs', 'arabjobs',
      // Posts platforms
      'linkedin-posts', 'x-search', 'reddit-search',
      'google-posts-linkedin', 'google-posts-x', 'google-posts-reddit'
    ];
    envelope.items = envelope.items.map(item => ({
      ...item,
      platformId: knownPlatforms.includes(item.platformId) ? item.platformId : 'linkedin'
    }));
    envelope.schemaVersion = 3;
  }

  // Migrate v3 → v4: add emotionalMode (defaults to 'normal')
  if (envelope.schemaVersion === 3) {
    envelope.items = envelope.items.map(item => ({
      ...item,
      emotionalMode: item.emotionalMode ?? 'normal'
    }));
    envelope.schemaVersion = 4;
  }

  // Migrate v4 → v5: add hiringSignals (defaults to disabled)
  if (envelope.schemaVersion === 4) {
    envelope.items = envelope.items.map(item => ({
      ...item,
      hiringSignals: item.hiringSignals ?? { enabled: false, selected: [] }
    }));
    envelope.schemaVersion = 5;
  }

  // Migrate v5 → v6: peopleLocation support (optional field in payload, no transformation needed)
  if (envelope.schemaVersion === 5) {
    envelope.schemaVersion = 6;
  }

  // Migrate v6 → v7: postsPayload support (optional field in payload, no transformation needed)
  // Also supports new posts platform IDs and 'posts' search type
  if (envelope.schemaVersion === 6) {
    envelope.schemaVersion = 7;
  }

  return envelope;
}
