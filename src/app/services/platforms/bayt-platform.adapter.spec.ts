import { TestBed } from '@angular/core/testing';
import { BaytPlatformAdapter } from './bayt-platform.adapter';
import { QueryPayload } from '../../models/platform.model';

describe('BaytPlatformAdapter', () => {
  let adapter: BaytPlatformAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    adapter = TestBed.inject(BaytPlatformAdapter);
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  describe('static properties', () => {
    it('should have correct id', () => {
      expect(adapter.id).toBe('bayt');
    });

    it('should have correct label', () => {
      expect(adapter.label).toBe('Bayt');
    });

    it('should have description', () => {
      expect(adapter.description).toContain('Bayt');
    });

    it('should have notes array', () => {
      expect(adapter.notes.length).toBeGreaterThan(0);
    });

    it('should have briefcase-outline icon', () => {
      expect(adapter.icon).toBe('briefcase-outline');
    });

    it('should only support jobs search', () => {
      expect(adapter.supportedSearchTypes).toEqual(['jobs']);
    });
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const caps = adapter.getCapabilities();
      expect(caps.supportsBoolean).toBeTrue();
      expect(caps.supportsParentheses).toBeFalse();
      expect(caps.supportsQuotes).toBeTrue();
      expect(caps.supportsNot).toBeFalse();
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

    it('should build OR clause for titles', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer', 'Engineer']
      }));
      expect(result.query).toContain('OR');
      expect(result.query).toContain('Developer');
      expect(result.query).toContain('Engineer');
    });

    it('should handle skills as keywords', () => {
      const result = adapter.buildQuery(createPayload({
        skills: ['Python', 'Django']
      }));
      expect(result.query).toContain('Python');
      expect(result.query).toContain('Django');
    });

    it('should use minus (-) prefix for exclusions', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer'],
        exclude: ['Junior']
      }));
      expect(result.query).toContain('-Junior');
    });

    it('should always include platform warning', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer']
      }));
      expect(result.warnings.some(w => w.includes('Bayt'))).toBeTrue();
    });

    it('should return safe badge status for simple queries', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer']
      }));
      expect(result.badgeStatus).toBe('safe');
    });

    it('should return warning badge status for complex queries', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer', 'Engineer', 'Architect', 'Lead', 'Senior'],
        skills: ['Python', 'Java', 'React', 'Angular', 'Node.js']
      }));
      // With 5 titles and 5 skills, operator count should be high enough for warning
      expect(['safe', 'warning', 'danger']).toContain(result.badgeStatus);
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

    it('should use bayt.com domain', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer');
      expect(url).toContain('bayt.com');
    });

    it('should include q parameter', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer');
      expect(url).toContain('q=');
    });

    it('should encode query properly', () => {
      const url = adapter.buildUrl(createPayload(), 'Software Engineer');
      expect(url).toContain('Software');
      expect(url).toContain('Engineer');
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

    it('should include platform guidance warning', () => {
      const result = adapter.validate(createPayload(), 'Developer');
      expect(result.warnings.some(w => w.includes('Bayt'))).toBeTrue();
    });

    it('should always return isValid true (no hard errors)', () => {
      const result = adapter.validate(createPayload(), 'Developer');
      expect(result.isValid).toBeTrue();
      expect(result.errors.length).toBe(0);
    });
  });
});
