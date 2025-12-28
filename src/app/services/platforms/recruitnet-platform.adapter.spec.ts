import { TestBed } from '@angular/core/testing';
import { RecruitNetPlatformAdapter } from './recruitnet-platform.adapter';
import { QueryPayload } from '../../models/platform.model';

describe('RecruitNetPlatformAdapter', () => {
  let adapter: RecruitNetPlatformAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    adapter = TestBed.inject(RecruitNetPlatformAdapter);
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  describe('static properties', () => {
    it('should have correct id', () => {
      expect(adapter.id).toBe('recruitnet');
    });

    it('should have correct label', () => {
      expect(adapter.label).toBe('Recruit.net');
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

    it('should flatten to keywords for titles', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer', 'Engineer']
      }));
      expect(result.query).toContain('Developer');
      expect(result.query).toContain('Engineer');
      expect(result.query).not.toContain('OR');
      expect(result.query).not.toContain('AND');
    });

    it('should include platform warning about keywords only', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer']
      }));
      expect(result.warnings.some(w => w.toLowerCase().includes('keyword') || w.toLowerCase().includes('simplified'))).toBeTrue();
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

    it('should use recruit.net domain', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer');
      expect(url).toContain('recruit.net');
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
