import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { HistoryRepositoryService } from './history-repository.service';
import { LocalStorageAdapter } from '../storage/local-storage.adapter';
import { HistoryCreateInput, MAX_HISTORY_ITEMS } from '../models/history-item.model';

describe('HistoryRepositoryService', () => {
  let service: HistoryRepositoryService;
  let storage: LocalStorageAdapter;

  const mockHistoryInput: HistoryCreateInput = {
    platformId: 'linkedin',
    searchType: 'people',
    mode: 'linkedin',
    payload: {
      searchType: 'people',
      titles: ['Software Engineer'],
      skills: ['JavaScript', 'TypeScript'],
      exclude: ['Junior']
    },
    booleanQuery: '(Software Engineer) AND JavaScript AND TypeScript NOT Junior',
    url: 'https://www.linkedin.com/search/results/people/?keywords=test',
    operatorCount: 4
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    storage = TestBed.inject(LocalStorageAdapter);
    storage.clear();
    service = TestBed.inject(HistoryRepositoryService);
    service.clearAll();
  });

  afterEach(() => {
    storage.clear();
    service.clearAll();
  });

  describe('add', () => {
    it('should create a history item with auto-generated fields', () => {
      const item = service.add(mockHistoryInput);

      expect(item.id).toBeTruthy();
      expect(item.createdAt).toBeTruthy();
      expect(item.platformId).toBe('linkedin');
      expect(item.searchType).toBe('people');
      expect(item.booleanQuery).toBe(mockHistoryInput.booleanQuery);
    });

    it('should persist item to storage', () => {
      service.add(mockHistoryInput);
      const list = service.list();

      expect(list.length).toBe(1);
      expect(list[0].booleanQuery).toBe(mockHistoryInput.booleanQuery);
    });

    it('should add new items at the beginning (most recent first)', () => {
      service.add({ ...mockHistoryInput, booleanQuery: 'First' });
      service.add({ ...mockHistoryInput, booleanQuery: 'Second' });
      service.add({ ...mockHistoryInput, booleanQuery: 'Third' });

      const list = service.list();

      expect(list[0].booleanQuery).toBe('Third');
      expect(list[2].booleanQuery).toBe('First');
    });

    it('should enforce max limit of 20 items (FIFO)', () => {
      // Add 25 items
      for (let i = 1; i <= 25; i++) {
        service.add({ ...mockHistoryInput, booleanQuery: `Query ${i}` });
      }

      const list = service.list();

      expect(list.length).toBe(MAX_HISTORY_ITEMS);
      expect(list.length).toBe(20);
      // Most recent should be Query 25
      expect(list[0].booleanQuery).toBe('Query 25');
      // Oldest should be Query 6 (1-5 were removed)
      expect(list[19].booleanQuery).toBe('Query 6');
    });

    it('should remove oldest items when exceeding max limit', () => {
      // Fill to max
      for (let i = 1; i <= 20; i++) {
        service.add({ ...mockHistoryInput, booleanQuery: `Query ${i}` });
      }

      expect(service.count()).toBe(20);

      // Add one more
      service.add({ ...mockHistoryInput, booleanQuery: 'New Query' });

      expect(service.count()).toBe(20);
      // Oldest (Query 1) should be removed
      const list = service.list();
      expect(list.find(item => item.booleanQuery === 'Query 1')).toBeUndefined();
      expect(list[0].booleanQuery).toBe('New Query');
    });
  });

  describe('list', () => {
    it('should return empty array when no history', () => {
      expect(service.list()).toEqual([]);
    });

    it('should return all items sorted by createdAt descending', () => {
      service.add({ ...mockHistoryInput, booleanQuery: 'First' });
      service.add({ ...mockHistoryInput, booleanQuery: 'Second' });
      service.add({ ...mockHistoryInput, booleanQuery: 'Third' });

      const list = service.list();

      expect(list.length).toBe(3);
      // Most recent first
      expect(list[0].booleanQuery).toBe('Third');
      expect(list[1].booleanQuery).toBe('Second');
      expect(list[2].booleanQuery).toBe('First');
    });
  });

  describe('getById', () => {
    it('should return item by ID', () => {
      const created = service.add(mockHistoryInput);
      const found = service.getById(created.id);

      expect(found).toBeTruthy();
      expect(found?.booleanQuery).toBe(mockHistoryInput.booleanQuery);
    });

    it('should return undefined for non-existent ID', () => {
      expect(service.getById('non-existent')).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete item', () => {
      const created = service.add(mockHistoryInput);
      const result = service.delete(created.id);

      expect(result).toBe(true);
      expect(service.getById(created.id)).toBeUndefined();
    });

    it('should return false for non-existent ID', () => {
      expect(service.delete('non-existent')).toBe(false);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      service.clearAll();
      service.add({
        ...mockHistoryInput,
        booleanQuery: 'Frontend Developer AND React',
        payload: {
          searchType: 'people',
          titles: ['Frontend Developer'],
          skills: ['React', 'JavaScript'],
          exclude: []
        }
      });
      service.add({
        ...mockHistoryInput,
        booleanQuery: 'Backend Engineer AND Node',
        payload: {
          searchType: 'people',
          titles: ['Backend Engineer'],
          skills: ['Node', 'Python'],
          exclude: []
        }
      });
      service.add({
        ...mockHistoryInput,
        booleanQuery: 'Full Stack AND TypeScript',
        payload: {
          searchType: 'people',
          titles: ['Full Stack Developer'],
          skills: ['TypeScript'],
          exclude: [],
          location: 'San Francisco'
        }
      });
    });

    it('should search by booleanQuery', () => {
      const results = service.search('Frontend');

      expect(results.length).toBe(1);
      expect(results[0].booleanQuery).toContain('Frontend');
    });

    it('should search by titles in payload', () => {
      const results = service.search('Backend Engineer');

      expect(results.length).toBe(1);
      expect(results[0].payload.titles).toContain('Backend Engineer');
    });

    it('should search by skills in payload', () => {
      const results = service.search('React');

      expect(results.length).toBe(1);
      expect(results[0].payload.skills).toContain('React');
    });

    it('should search by location in payload', () => {
      const results = service.search('San Francisco');

      expect(results.length).toBe(1);
      expect(results[0].payload.location).toBe('San Francisco');
    });

    it('should return all for empty query', () => {
      expect(service.search('').length).toBe(3);
    });

    it('should be case-insensitive', () => {
      const results = service.search('TYPESCRIPT');

      expect(results.length).toBe(1);
      expect(results[0].booleanQuery).toContain('TypeScript');
    });
  });

  describe('count', () => {
    it('should return correct count', () => {
      expect(service.count()).toBe(0);

      service.add(mockHistoryInput);
      expect(service.count()).toBe(1);

      service.add({ ...mockHistoryInput, booleanQuery: 'Second' });
      expect(service.count()).toBe(2);
    });
  });

  describe('clearAll', () => {
    it('should remove all items', () => {
      service.add(mockHistoryInput);
      service.add({ ...mockHistoryInput, booleanQuery: 'Second' });
      expect(service.count()).toBe(2);

      service.clearAll();
      expect(service.count()).toBe(0);
    });
  });
});
