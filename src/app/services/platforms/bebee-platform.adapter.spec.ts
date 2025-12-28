import { TestBed } from '@angular/core/testing';
import { BeBeePlatformAdapter } from './bebee-platform.adapter';
import { QueryPayload } from '../../models/platform.model';

describe('BeBeePlatformAdapter', () => {
  let adapter: BeBeePlatformAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    adapter = TestBed.inject(BeBeePlatformAdapter);
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  describe('static properties', () => {
    it('should have correct id', () => {
      expect(adapter.id).toBe('bebee');
    });

    it('should have correct label', () => {
      expect(adapter.label).toBe('beBee');
    });

    it('should only support jobs search', () => {
      expect(adapter.supportedSearchTypes).toEqual(['jobs']);
    });
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const caps = adapter.getCapabilities();
      expect(caps.booleanLevel).toBe('none');
      expect(caps.supportsOR).toBeFalse();
      expect(caps.supportsAND).toBeFalse();
      expect(caps.supportsMinusExclude).toBeFalse();
      expect(caps.region).toBe('global');
    });
  });

  describe('buildQuery', () => {
    const createPayload = (overrides: Partial<QueryPayload> = {}): QueryPayload => ({
      searchType: 'jobs',
      titles: [],
      skills: [],
      exclude: [],
      ...overrides
    });

    it('should return empty string for empty payload', () => {
      const result = adapter.buildQuery(createPayload());
      expect(result.query).toBe('');
    });

    it('should flatten to keywords', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer', 'Engineer']
      }));
      expect(result.query).toContain('Developer');
      expect(result.query).toContain('Engineer');
      expect(result.query).not.toContain('OR');
      expect(result.query).not.toContain('AND');
    });

    it('should include platform warning', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer']
      }));
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('buildUrl', () => {
    const createPayload = (overrides: Partial<QueryPayload> = {}): QueryPayload => ({
      searchType: 'jobs',
      titles: [],
      skills: [],
      exclude: [],
      ...overrides
    });

    it('should return empty string for empty query', () => {
      const url = adapter.buildUrl(createPayload(), '');
      expect(url).toBe('');
    });

    it('should use bebee.com domain', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer');
      expect(url).toContain('bebee.com');
    });
  });

  describe('validate', () => {
    const createPayload = (overrides: Partial<QueryPayload> = {}): QueryPayload => ({
      searchType: 'jobs',
      titles: [],
      skills: [],
      exclude: [],
      ...overrides
    });

    it('should be valid for normal queries', () => {
      const result = adapter.validate(createPayload(), 'Developer');
      expect(result.isValid).toBeTrue();
    });
  });
});
