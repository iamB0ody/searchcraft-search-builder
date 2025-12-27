import { TestBed } from '@angular/core/testing';
import { GooglePlatformAdapter } from './google-platform.adapter';
import { QueryPayload } from '../../models/platform.model';

describe('GooglePlatformAdapter', () => {
  let adapter: GooglePlatformAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    adapter = TestBed.inject(GooglePlatformAdapter);
    // Reset to default state
    adapter.restrictToLinkedIn.set(true);
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  describe('static properties', () => {
    it('should have correct id', () => {
      expect(adapter.id).toBe('google');
    });

    it('should have correct label', () => {
      expect(adapter.label).toBe('Google');
    });

    it('should have description', () => {
      expect(adapter.description).toContain('X-ray');
    });

    it('should have notes array', () => {
      expect(adapter.notes.length).toBeGreaterThan(0);
      expect(adapter.notes.some(n => n.includes('minus') || n.includes('-'))).toBeTrue();
    });

    it('should have google logo icon', () => {
      expect(adapter.icon).toBe('logo-google');
    });

    it('should support both people and jobs search', () => {
      expect(adapter.supportedSearchTypes).toContain('people');
      expect(adapter.supportedSearchTypes).toContain('jobs');
    });
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const caps = adapter.getCapabilities();
      expect(caps.supportsBoolean).toBeTrue();
      expect(caps.supportsParentheses).toBeTrue();
      expect(caps.supportsQuotes).toBeTrue();
      expect(caps.supportsNot).toBeFalse(); // Google uses - instead
      expect(caps.maxOperators).toBeUndefined();
      expect(caps.maxQueryLength).toBe(2048);
    });
  });

  describe('restrictToLinkedIn signal', () => {
    it('should default to true', () => {
      const freshAdapter = new GooglePlatformAdapter();
      expect(freshAdapter.restrictToLinkedIn()).toBeTrue();
    });

    it('should be toggleable', () => {
      adapter.restrictToLinkedIn.set(false);
      expect(adapter.restrictToLinkedIn()).toBeFalse();
      adapter.restrictToLinkedIn.set(true);
      expect(adapter.restrictToLinkedIn()).toBeTrue();
    });
  });

  describe('buildQuery', () => {
    const createPayload = (overrides: Partial<QueryPayload> = {}): QueryPayload => ({
      searchType: 'people',
      titles: [],
      skills: [],
      exclude: [],
      ...overrides
    });

    it('should return empty string for empty payload', () => {
      const result = adapter.buildQuery(createPayload());
      expect(result.query).toBe('');
    });

    describe('with restrictToLinkedIn enabled', () => {
      beforeEach(() => {
        adapter.restrictToLinkedIn.set(true);
      });

      it('should add site:linkedin.com/in prefix for people search', () => {
        const result = adapter.buildQuery(createPayload({
          searchType: 'people',
          titles: ['Developer']
        }));
        expect(result.query).toContain('site:linkedin.com/in');
      });

      it('should add site:linkedin.com/jobs prefix for jobs search', () => {
        const result = adapter.buildQuery(createPayload({
          searchType: 'jobs',
          titles: ['Developer']
        }));
        expect(result.query).toContain('site:linkedin.com/jobs');
      });
    });

    describe('with restrictToLinkedIn disabled', () => {
      beforeEach(() => {
        adapter.restrictToLinkedIn.set(false);
      });

      it('should NOT add site: prefix', () => {
        const result = adapter.buildQuery(createPayload({
          titles: ['Developer']
        }));
        expect(result.query).not.toContain('site:');
      });
    });

    describe('exclusion format', () => {
      it('should use minus (-) prefix for exclusions', () => {
        const result = adapter.buildQuery(createPayload({
          exclude: ['Junior', 'Intern']
        }));
        expect(result.query).toContain('-Junior');
        expect(result.query).toContain('-Intern');
        expect(result.query).not.toContain('NOT');
      });

      it('should quote multi-word exclusions with minus', () => {
        const result = adapter.buildQuery(createPayload({
          exclude: ['Junior Developer']
        }));
        expect(result.query).toContain('-"Junior Developer"');
      });
    });

    it('should build OR clause for titles', () => {
      adapter.restrictToLinkedIn.set(false);
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer', 'Engineer']
      }));
      expect(result.query).toBe('(Developer OR Engineer)');
    });

    it('should build AND clause for skills', () => {
      adapter.restrictToLinkedIn.set(false);
      const result = adapter.buildQuery(createPayload({
        skills: ['Angular', 'TypeScript']
      }));
      expect(result.query).toBe('(Angular AND TypeScript)');
    });

    it('should combine all clauses with site prefix', () => {
      adapter.restrictToLinkedIn.set(true);
      const result = adapter.buildQuery(createPayload({
        searchType: 'people',
        titles: ['Developer'],
        skills: ['Angular'],
        exclude: ['Junior']
      }));
      expect(result.query).toBe('site:linkedin.com/in (Developer) AND (Angular) -Junior');
    });

    it('should add Google-specific warning', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer']
      }));
      expect(result.warnings.some(w => w.includes('Google'))).toBeTrue();
    });

    it('should return safe badge status for simple queries', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer']
      }));
      expect(result.badgeStatus).toBe('safe');
    });
  });

  describe('buildUrl', () => {
    const createPayload = (overrides: Partial<QueryPayload> = {}): QueryPayload => ({
      searchType: 'people',
      titles: [],
      skills: [],
      exclude: [],
      ...overrides
    });

    it('should return empty string for empty query', () => {
      const url = adapter.buildUrl(createPayload(), '');
      expect(url).toBe('');
    });

    it('should build Google search URL', () => {
      const url = adapter.buildUrl(createPayload(), 'site:linkedin.com/in Developer');
      expect(url).toContain('google.com/search');
    });

    it('should include q parameter', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer AND Angular');
      expect(url).toContain('q=');
    });

    it('should encode query properly', () => {
      const url = adapter.buildUrl(createPayload(), 'site:linkedin.com/in Developer AND Angular');
      // URLSearchParams uses + for spaces, which is valid
      expect(url).toContain('q=site');
      expect(url).toContain('Developer+AND+Angular');
    });

    it('should produce valid URL format', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer');
      expect(url).toMatch(/^https:\/\/www\.google\.com\/search\?q=/);
    });
  });

  describe('validate', () => {
    const createPayload = (overrides: Partial<QueryPayload> = {}): QueryPayload => ({
      searchType: 'people',
      titles: [],
      skills: [],
      exclude: [],
      ...overrides
    });

    it('should be valid for normal queries', () => {
      const result = adapter.validate(createPayload(), 'site:linkedin.com/in Developer');
      expect(result.isValid).toBeTrue();
    });

    it('should warn about long queries', () => {
      const longQuery = 'a'.repeat(2100);
      const result = adapter.validate(createPayload(), longQuery);
      expect(result.warnings.some(w => w.includes('length'))).toBeTrue();
    });

    it('should warn about parentheses behavior', () => {
      const result = adapter.validate(createPayload(), 'Developer');
      expect(result.warnings.some(w => w.includes('parentheses'))).toBeTrue();
    });

    describe('restrictToLinkedIn warnings', () => {
      it('should warn when restrictToLinkedIn is disabled', () => {
        adapter.restrictToLinkedIn.set(false);
        const result = adapter.validate(createPayload(), 'Developer');
        expect(result.warnings.some(w => w.includes('Without site:'))).toBeTrue();
      });

      it('should NOT warn about site: when restrictToLinkedIn is enabled', () => {
        adapter.restrictToLinkedIn.set(true);
        const result = adapter.validate(createPayload(), 'Developer');
        expect(result.warnings.some(w => w.includes('Without site:'))).toBeFalse();
      });
    });

    it('should always return isValid true (no hard errors)', () => {
      const result = adapter.validate(createPayload(), 'a'.repeat(3000));
      expect(result.isValid).toBeTrue();
      expect(result.errors.length).toBe(0);
    });
  });
});
