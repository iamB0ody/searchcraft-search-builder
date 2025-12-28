import { TestBed } from '@angular/core/testing';
import { GulfTalentPlatformAdapter } from './gulftalent-platform.adapter';
import { QueryPayload } from '../../models/platform.model';

describe('GulfTalentPlatformAdapter', () => {
  let adapter: GulfTalentPlatformAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    adapter = TestBed.inject(GulfTalentPlatformAdapter);
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  describe('static properties', () => {
    it('should have correct id', () => {
      expect(adapter.id).toBe('gulftalent');
    });

    it('should have correct label', () => {
      expect(adapter.label).toBe('GulfTalent');
    });

    it('should only support jobs search', () => {
      expect(adapter.supportedSearchTypes).toEqual(['jobs']);
    });
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const caps = adapter.getCapabilities();
      expect(caps.booleanLevel).toBe('partial');
      expect(caps.supportsOR).toBeTrue();
      expect(caps.supportsAND).toBeFalse();
      expect(caps.supportsMinusExclude).toBeTrue();
      expect(caps.region).toBe('mena');
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

    it('should build query for titles', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer', 'Engineer']
      }));
      expect(result.query).toContain('Developer');
      expect(result.query).toContain('Engineer');
    });

    it('should include platform warning', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer']
      }));
      expect(result.warnings.some(w => w.toLowerCase().includes('gulftalent') || w.includes('limited'))).toBeTrue();
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

    it('should use gulftalent.com domain', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer');
      expect(url).toContain('gulftalent.com');
    });

    it('should include keywords parameter', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer');
      expect(url).toContain('keywords=');
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
