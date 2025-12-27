import { QueryPayload } from '../../models/platform.model';
import { SearchMode } from '../../models/search-form.model';

/**
 * A saved search preset
 */
export interface Preset {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  payload: QueryPayload;
  platformId: string;
  mode?: SearchMode;
  tags?: string[];
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
 * Migrate storage data to current schema version
 */
export function migrateStorage(data: unknown): PresetStorageEnvelope {
  if (!data || typeof data !== 'object') {
    return { schemaVersion: 1, presets: [] };
  }

  const envelope = data as PresetStorageEnvelope;

  // Handle missing schemaVersion (legacy data)
  if (!envelope.schemaVersion) {
    return { schemaVersion: 1, presets: envelope.presets || [] };
  }

  // Future migration logic would go here:
  // if (envelope.schemaVersion === 1) { migrate to 2 }
  // if (envelope.schemaVersion === 2) { migrate to 3 }

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
