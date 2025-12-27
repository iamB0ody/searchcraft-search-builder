import { Injectable, inject } from '@angular/core';
import { LocalStorageAdapter } from '../storage/local-storage.adapter';
import {
  Preset,
  PresetStorageEnvelope,
  PresetCreateInput,
  PresetUpdateInput,
  generateUUID,
  migrateStorage,
  validatePreset,
  CURRENT_SCHEMA_VERSION
} from '../models/preset.model';

/**
 * Repository service for managing presets in storage
 * Provides CRUD operations with versioning and migration support
 */
@Injectable({ providedIn: 'root' })
export class PresetRepositoryService {
  private readonly STORAGE_KEY = 'searchcraft_presets';
  private readonly storage = inject(LocalStorageAdapter);

  /**
   * List all presets, sorted by pinned first, then updatedAt descending
   */
  list(): Preset[] {
    const envelope = this.loadEnvelope();
    return [...envelope.presets].sort((a, b) => {
      // Pinned presets first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      // Then by updatedAt descending
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  /**
   * Get a preset by ID
   */
  getById(id: string): Preset | undefined {
    const envelope = this.loadEnvelope();
    return envelope.presets.find(p => p.id === id);
  }

  /**
   * Create a new preset
   */
  create(input: PresetCreateInput): Preset {
    const errors = validatePreset(input);
    if (errors.length > 0) {
      throw new Error(`Invalid preset: ${errors.join(', ')}`);
    }

    const now = new Date().toISOString();
    const newPreset: Preset = {
      ...input,
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
      version: 1
    };

    const envelope = this.loadEnvelope();
    envelope.presets.push(newPreset);
    this.saveEnvelope(envelope);

    return newPreset;
  }

  /**
   * Update an existing preset
   */
  update(id: string, partial: PresetUpdateInput): Preset | null {
    const envelope = this.loadEnvelope();
    const index = envelope.presets.findIndex(p => p.id === id);

    if (index === -1) {
      return null;
    }

    const existing = envelope.presets[index];
    const updated: Preset = {
      ...existing,
      ...partial,
      id: existing.id, // Ensure ID cannot be changed
      createdAt: existing.createdAt, // Ensure createdAt cannot be changed
      updatedAt: new Date().toISOString(),
      version: existing.version + 1
    };

    envelope.presets[index] = updated;
    this.saveEnvelope(envelope);

    return updated;
  }

  /**
   * Delete a preset by ID
   */
  delete(id: string): boolean {
    const envelope = this.loadEnvelope();
    const index = envelope.presets.findIndex(p => p.id === id);

    if (index === -1) {
      return false;
    }

    envelope.presets.splice(index, 1);
    this.saveEnvelope(envelope);

    return true;
  }

  /**
   * Update lastUsedAt timestamp when preset is applied
   */
  touchLastUsedAt(id: string): void {
    const envelope = this.loadEnvelope();
    const index = envelope.presets.findIndex(p => p.id === id);

    if (index !== -1) {
      envelope.presets[index].lastUsedAt = new Date().toISOString();
      this.saveEnvelope(envelope);
    }
  }

  /**
   * Toggle pinned state for a preset
   */
  togglePin(id: string): Preset | null {
    const envelope = this.loadEnvelope();
    const index = envelope.presets.findIndex(p => p.id === id);

    if (index === -1) {
      return null;
    }

    envelope.presets[index].pinned = !envelope.presets[index].pinned;
    envelope.presets[index].updatedAt = new Date().toISOString();
    this.saveEnvelope(envelope);

    return envelope.presets[index];
  }

  /**
   * Duplicate a preset with a new name
   */
  duplicate(id: string): Preset | null {
    const original = this.getById(id);

    if (!original) {
      return null;
    }

    return this.create({
      name: `${original.name} (Copy)`,
      notes: original.notes,
      payload: { ...original.payload },
      platformId: original.platformId,
      mode: original.mode,
      tags: original.tags ? [...original.tags] : undefined
      // Note: lastUsedAt and pinned are not copied
    });
  }

  /**
   * Export a single preset as JSON string
   */
  exportPreset(id: string): string | null {
    const preset = this.getById(id);

    if (!preset) {
      return null;
    }

    return JSON.stringify({ schemaVersion: CURRENT_SCHEMA_VERSION, preset }, null, 2);
  }

  /**
   * Export all presets as JSON string
   */
  exportAll(): string {
    const envelope = this.loadEnvelope();
    return JSON.stringify(envelope, null, 2);
  }

  /**
   * Import a preset from JSON string
   * Returns the imported preset or null if invalid
   */
  importPreset(json: string): Preset | null {
    try {
      const data = JSON.parse(json);

      if (data.preset) {
        // Single preset import
        const { id, createdAt, updatedAt, version, ...rest } = data.preset;
        return this.create(rest);
      }

      if (data.presets && Array.isArray(data.presets) && data.presets.length > 0) {
        // Bulk import - import the first preset
        const preset = data.presets[0];
        const { id, createdAt, updatedAt, version, ...rest } = preset;
        return this.create(rest);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Import multiple presets from JSON string
   * Returns array of imported presets
   */
  importAll(json: string): Preset[] {
    try {
      const data = JSON.parse(json);
      const imported: Preset[] = [];

      if (data.presets && Array.isArray(data.presets)) {
        for (const preset of data.presets) {
          try {
            const { id, createdAt, updatedAt, version, ...rest } = preset;
            const newPreset = this.create(rest);
            imported.push(newPreset);
          } catch {
            // Skip invalid presets
          }
        }
      }

      return imported;
    } catch {
      return [];
    }
  }

  /**
   * Search presets by name, notes, or tags (case-insensitive)
   */
  search(query: string): Preset[] {
    const lower = query.toLowerCase().trim();
    if (!lower) {
      return this.list();
    }

    return this.list().filter(p =>
      p.name.toLowerCase().includes(lower) ||
      p.notes?.toLowerCase().includes(lower) ||
      p.tags?.some(t => t.toLowerCase().includes(lower))
    );
  }

  /**
   * Get count of presets
   */
  count(): number {
    return this.loadEnvelope().presets.length;
  }

  /**
   * Clear all presets (use with caution)
   */
  clearAll(): void {
    this.saveEnvelope({ schemaVersion: CURRENT_SCHEMA_VERSION, presets: [] });
  }

  private loadEnvelope(): PresetStorageEnvelope {
    const raw = this.storage.get(this.STORAGE_KEY);

    if (!raw) {
      return { schemaVersion: 1, presets: [] };
    }

    try {
      const data = JSON.parse(raw);
      return migrateStorage(data);
    } catch {
      // Corrupted storage, reset
      console.warn('Corrupted preset storage, resetting');
      return { schemaVersion: 1, presets: [] };
    }
  }

  private saveEnvelope(envelope: PresetStorageEnvelope): void {
    this.storage.set(this.STORAGE_KEY, JSON.stringify(envelope));
  }
}
