import { QueryPayload } from '../../models/platform.model';
import { SearchMode } from '../../models/search-form.model';
import { EmotionalSearchMode } from '../../models/emotional-mode.model';
import { HiringSignalsState } from '../people-signals/hiring-signals.model';

/**
 * A saved search preset
 */
export interface Preset {
  id: string;
  name: string;
  notes?: string;          // Renamed from description
  createdAt: string;
  updatedAt: string;
  version: number;
  payload: QueryPayload;
  platformId: string;
  mode?: SearchMode;
  tags?: string[];
  lastUsedAt?: string;     // ISO timestamp, updated when preset is applied
  pinned?: boolean;        // Pinned presets appear at top of list
  emotionalMode?: EmotionalSearchMode;  // Emotional search mode (defaults to 'normal')
  hiringSignals?: HiringSignalsState;   // Hiring signals state (People search only)
}

/**
 * Storage envelope for migration support
 */
export interface PresetStorageEnvelope {
  schemaVersion: number;
  presets: Preset[];
}

/**
 * Input for creating a new preset (without auto-generated fields)
 */
export type PresetCreateInput = Omit<Preset, 'id' | 'createdAt' | 'updatedAt' | 'version'>;

/**
 * Input for updating a preset (partial, excluding immutable fields)
 */
export type PresetUpdateInput = Partial<Omit<Preset, 'id' | 'createdAt'>>;

/**
 * Current schema version
 */
export const CURRENT_SCHEMA_VERSION = 8;

/**
 * Migrate storage data to current schema version
 */
export function migrateStorage(data: unknown): PresetStorageEnvelope {
  if (!data || typeof data !== 'object') {
    return { schemaVersion: CURRENT_SCHEMA_VERSION, presets: [] };
  }

  const envelope = data as PresetStorageEnvelope;

  // Handle missing schemaVersion (legacy data)
  if (!envelope.schemaVersion) {
    envelope.schemaVersion = 1;
    envelope.presets = envelope.presets || [];
  }

  // Migrate v1 → v2: rename description→notes, add lastUsedAt/pinned
  if (envelope.schemaVersion === 1) {
    envelope.presets = envelope.presets.map(p => {
      const preset = p as Preset & { description?: string };
      return {
        ...preset,
        notes: preset.description ?? preset.notes ?? undefined,
        lastUsedAt: preset.lastUsedAt ?? undefined,
        pinned: preset.pinned ?? false,
        description: undefined  // Remove old field
      };
    }).map(p => {
      // Clean up undefined description field
      const { description, ...rest } = p as Preset & { description?: string };
      return rest as Preset;
    });
    envelope.schemaVersion = 2;
  }

  // Migrate v2 → v3: rename platformId 'google' to 'google-jobs'
  if (envelope.schemaVersion === 2) {
    envelope.presets = envelope.presets.map(p => ({
      ...p,
      platformId: p.platformId === 'google' ? 'google-jobs' : p.platformId
    }));
    envelope.schemaVersion = 3;
  }

  // Migrate v3 → v4: add fallback for unknown platformIds (new MENA platforms)
  if (envelope.schemaVersion === 3) {
    const knownPlatforms = [
      'linkedin', 'salesnav', 'google-jobs', 'indeed',
      'bayt', 'gulftalent', 'naukrigulf', 'recruitnet', 'bebee', 'gulfjobs', 'arabjobs',
      // Posts platforms
      'linkedin-posts', 'x-search', 'reddit-search',
      'google-posts-linkedin', 'google-posts-x', 'google-posts-reddit'
    ];
    envelope.presets = envelope.presets.map(p => ({
      ...p,
      platformId: knownPlatforms.includes(p.platformId) ? p.platformId : 'linkedin'
    }));
    envelope.schemaVersion = 4;
  }

  // Migrate v4 → v5: add emotionalMode (defaults to 'normal')
  if (envelope.schemaVersion === 4) {
    envelope.presets = envelope.presets.map(p => ({
      ...p,
      emotionalMode: p.emotionalMode ?? 'normal'
    }));
    envelope.schemaVersion = 5;
  }

  // Migrate v5 → v6: add hiringSignals (defaults to disabled)
  if (envelope.schemaVersion === 5) {
    envelope.presets = envelope.presets.map(p => ({
      ...p,
      hiringSignals: p.hiringSignals ?? { enabled: false, selected: [] }
    }));
    envelope.schemaVersion = 6;
  }

  // Migrate v6 → v7: peopleLocation support (optional field in payload, no transformation needed)
  if (envelope.schemaVersion === 6) {
    envelope.schemaVersion = 7;
  }

  // Migrate v7 → v8: postsPayload support (optional field in payload, no transformation needed)
  // Also supports new posts platform IDs
  if (envelope.schemaVersion === 7) {
    envelope.schemaVersion = 8;
  }

  return envelope;
}

/**
 * Generate a UUID for preset IDs
 */
export function generateUUID(): string {
  // Use native crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validate preset has required fields
 */
export function validatePreset(preset: Partial<Preset>): string[] {
  const errors: string[] = [];

  if (!preset.name?.trim()) {
    errors.push('Name is required');
  }

  if (!preset.payload) {
    errors.push('Payload is required');
  }

  if (!preset.platformId) {
    errors.push('Platform ID is required');
  }

  return errors;
}
