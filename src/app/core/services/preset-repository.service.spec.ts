import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { PresetRepositoryService } from './preset-repository.service';
import { LocalStorageAdapter } from '../storage/local-storage.adapter';
import { Preset, PresetCreateInput, migrateStorage, CURRENT_SCHEMA_VERSION } from '../models/preset.model';

describe('PresetRepositoryService', () => {
  let service: PresetRepositoryService;
  let storage: LocalStorageAdapter;

  const mockPresetInput: PresetCreateInput = {
    name: 'Test Preset',
    notes: 'A test preset',
    payload: {
      searchType: 'people',
      titles: ['Software Engineer'],
      skills: ['JavaScript', 'TypeScript'],
      exclude: ['Junior']
    },
    platformId: 'linkedin',
    mode: 'linkedin',
    tags: ['dev', 'tech']
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    storage = TestBed.inject(LocalStorageAdapter);
    storage.clear();
    service = TestBed.inject(PresetRepositoryService);
    // Ensure clean state for each test
    service.clearAll();
  });

  afterEach(() => {
    storage.clear();
    service.clearAll();
  });

  describe('create', () => {
    it('should create a preset with auto-generated fields', () => {
      const preset = service.create(mockPresetInput);

      expect(preset.id).toBeTruthy();
      expect(preset.name).toBe('Test Preset');
      expect(preset.version).toBe(1);
      expect(preset.createdAt).toBeTruthy();
      expect(preset.updatedAt).toBeTruthy();
    });

    it('should throw error for invalid preset', () => {
      expect(() => service.create({ ...mockPresetInput, name: '' }))
        .toThrowError(/Name is required/);
    });

    it('should persist preset to storage', () => {
      service.create(mockPresetInput);
      const list = service.list();

      expect(list.length).toBe(1);
      expect(list[0].name).toBe('Test Preset');
    });
  });

  describe('list', () => {
    it('should return empty array when no presets', () => {
      expect(service.list()).toEqual([]);
    });

    it('should return all presets', () => {
      service.create({ ...mockPresetInput, name: 'First' });
      service.create({ ...mockPresetInput, name: 'Second' });
      service.create({ ...mockPresetInput, name: 'Third' });

      const list = service.list();

      expect(list.length).toBe(3);
      expect(list.map(p => p.name)).toContain('First');
      expect(list.map(p => p.name)).toContain('Second');
      expect(list.map(p => p.name)).toContain('Third');
    });
  });

  describe('getById', () => {
    it('should return preset by ID', () => {
      const created = service.create(mockPresetInput);
      const found = service.getById(created.id);

      expect(found).toBeTruthy();
      expect(found?.name).toBe('Test Preset');
    });

    it('should return undefined for non-existent ID', () => {
      expect(service.getById('non-existent')).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update preset name', () => {
      const created = service.create(mockPresetInput);
      const updated = service.update(created.id, { name: 'Updated Name' });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.version).toBe(2);
    });

    it('should not change createdAt on update', () => {
      const created = service.create(mockPresetInput);
      const updated = service.update(created.id, { name: 'Updated' });

      expect(updated?.createdAt).toBe(created.createdAt);
    });

    it('should return null for non-existent ID', () => {
      expect(service.update('non-existent', { name: 'Test' })).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete preset', () => {
      const created = service.create(mockPresetInput);
      const result = service.delete(created.id);

      expect(result).toBe(true);
      expect(service.getById(created.id)).toBeUndefined();
    });

    it('should return false for non-existent ID', () => {
      expect(service.delete('non-existent')).toBe(false);
    });
  });

  describe('duplicate', () => {
    it('should create a copy with "(Copy)" suffix', () => {
      const original = service.create(mockPresetInput);
      const copy = service.duplicate(original.id);

      expect(copy?.name).toBe('Test Preset (Copy)');
      expect(copy?.id).not.toBe(original.id);
      expect(copy?.payload).toEqual(original.payload);
    });

    it('should return null for non-existent ID', () => {
      expect(service.duplicate('non-existent')).toBeNull();
    });
  });

  describe('export/import', () => {
    it('should export preset as JSON', () => {
      const created = service.create(mockPresetInput);
      const json = service.exportPreset(created.id);

      expect(json).toBeTruthy();
      const parsed = JSON.parse(json!);
      expect(parsed.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(parsed.preset.name).toBe('Test Preset');
    });

    it('should import preset from JSON', () => {
      const created = service.create(mockPresetInput);
      const json = service.exportPreset(created.id)!;

      service.clearAll();
      expect(service.count()).toBe(0);

      const imported = service.importPreset(json);

      expect(imported?.name).toBe('Test Preset');
      expect(service.count()).toBe(1);
    });

    it('should return null for invalid JSON', () => {
      expect(service.importPreset('invalid json')).toBeNull();
    });

    it('should export all presets', () => {
      service.create({ ...mockPresetInput, name: 'First' });
      service.create({ ...mockPresetInput, name: 'Second' });

      const json = service.exportAll();
      const parsed = JSON.parse(json);

      expect(parsed.presets.length).toBe(2);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      // Ensure clean state for search tests
      service.clearAll();
      service.create({ ...mockPresetInput, name: 'Frontend Developer', tags: ['react'] });
      service.create({ ...mockPresetInput, name: 'Backend Engineer', tags: ['node'] });
      service.create({ ...mockPresetInput, name: 'Full Stack', notes: 'Frontend and backend' });
    });

    it('should search by name', () => {
      const results = service.search('Developer');

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Frontend Developer');
    });

    it('should search by notes', () => {
      const results = service.search('backend');

      expect(results.length).toBe(2); // Backend Engineer + Full Stack (notes)
    });

    it('should search by tags', () => {
      const results = service.search('react');

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Frontend Developer');
    });

    it('should return all for empty query', () => {
      expect(service.search('').length).toBe(3);
    });
  });

  describe('count', () => {
    it('should return correct count', () => {
      expect(service.count()).toBe(0);

      service.create(mockPresetInput);
      expect(service.count()).toBe(1);

      service.create({ ...mockPresetInput, name: 'Second' });
      expect(service.count()).toBe(2);
    });
  });

  describe('clearAll', () => {
    it('should remove all presets', () => {
      service.create(mockPresetInput);
      service.create({ ...mockPresetInput, name: 'Second' });
      expect(service.count()).toBe(2);

      service.clearAll();
      expect(service.count()).toBe(0);
    });
  });

  describe('touchLastUsedAt', () => {
    it('should update lastUsedAt timestamp', () => {
      const preset = service.create(mockPresetInput);
      expect(preset.lastUsedAt).toBeUndefined();

      service.touchLastUsedAt(preset.id);

      const updated = service.getById(preset.id);
      expect(updated?.lastUsedAt).toBeTruthy();
      expect(new Date(updated!.lastUsedAt!).getTime()).toBeGreaterThan(0);
    });

    it('should not throw for non-existent ID', () => {
      expect(() => service.touchLastUsedAt('non-existent')).not.toThrow();
    });
  });

  describe('togglePin', () => {
    it('should toggle pinned from false to true', () => {
      const preset = service.create(mockPresetInput);
      expect(preset.pinned).toBeFalsy();

      const toggled = service.togglePin(preset.id);

      expect(toggled?.pinned).toBe(true);
    });

    it('should toggle pinned from true to false', () => {
      const preset = service.create({ ...mockPresetInput, pinned: true });
      expect(preset.pinned).toBe(true);

      const toggled = service.togglePin(preset.id);

      expect(toggled?.pinned).toBe(false);
    });

    it('should update updatedAt timestamp', async () => {
      const preset = service.create(mockPresetInput);
      const originalUpdatedAt = new Date(preset.updatedAt).getTime();

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      const toggled = service.togglePin(preset.id);

      expect(new Date(toggled!.updatedAt).getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
    });

    it('should return null for non-existent ID', () => {
      expect(service.togglePin('non-existent')).toBeNull();
    });
  });

  describe('list sorting with pinned', () => {
    it('should return pinned presets first', () => {
      service.create({ ...mockPresetInput, name: 'Unpinned 1' });
      service.create({ ...mockPresetInput, name: 'Pinned', pinned: true });
      service.create({ ...mockPresetInput, name: 'Unpinned 2' });

      const list = service.list();

      expect(list[0].name).toBe('Pinned');
      expect(list[0].pinned).toBe(true);
    });

    it('should sort pinned presets by updatedAt', async () => {
      service.create({ ...mockPresetInput, name: 'Pinned Old', pinned: true });
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      service.create({ ...mockPresetInput, name: 'Pinned New', pinned: true });

      const list = service.list();

      expect(list[0].name).toBe('Pinned New');
      expect(list[1].name).toBe('Pinned Old');
    });

    it('should sort unpinned presets by updatedAt after pinned', async () => {
      service.create({ ...mockPresetInput, name: 'Unpinned Old' });
      await new Promise(resolve => setTimeout(resolve, 10));
      service.create({ ...mockPresetInput, name: 'Pinned', pinned: true });
      await new Promise(resolve => setTimeout(resolve, 10));
      service.create({ ...mockPresetInput, name: 'Unpinned New' });

      const list = service.list();

      expect(list[0].name).toBe('Pinned');
      expect(list[1].name).toBe('Unpinned New');
      expect(list[2].name).toBe('Unpinned Old');
    });
  });

  describe('migrateStorage', () => {
    it('should return empty envelope for null data', () => {
      const result = migrateStorage(null);

      expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(result.presets).toEqual([]);
    });

    it('should migrate v1 description to notes', () => {
      const v1Data = {
        schemaVersion: 1,
        presets: [{
          id: 'test-id',
          name: 'Test',
          description: 'Old description',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          version: 1,
          payload: { searchType: 'people', titles: [], skills: [], exclude: [] },
          platformId: 'linkedin'
        }]
      };

      const result = migrateStorage(v1Data);

      expect(result.schemaVersion).toBe(3);
      expect(result.presets[0].notes).toBe('Old description');
      expect((result.presets[0] as any).description).toBeUndefined();
    });

    it('should add default values for new fields in v1 → v2 migration', () => {
      const v1Data = {
        schemaVersion: 1,
        presets: [{
          id: 'test-id',
          name: 'Test',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          version: 1,
          payload: { searchType: 'people', titles: [], skills: [], exclude: [] },
          platformId: 'linkedin'
        }]
      };

      const result = migrateStorage(v1Data);

      expect(result.presets[0].pinned).toBe(false);
      expect(result.presets[0].lastUsedAt).toBeUndefined();
    });
  });
});
