import { TestBed } from '@angular/core/testing';
import { GoogleJobsPlatformAdapter } from './google-jobs-platform.adapter';
import { QueryPayload } from '../../models/platform.model';

describe('GoogleJobsPlatformAdapter', () => {
  let adapter: GoogleJobsPlatformAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    adapter = TestBed.inject(GoogleJobsPlatformAdapter);
    // Reset to default state
    adapter.includeLocationKeyword.set(true);
    adapter.skillsJoiner.set('OR');
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  describe('static properties', () => {
    it('should have correct id', () => {
      expect(adapter.id).toBe('google-jobs');
    });

    it('should have correct label', () => {
      expect(adapter.label).toBe('Google Jobs');
    });

    it('should have description', () => {
      expect(adapter.description).toContain('Google Jobs');
    });

    it('should have notes array with relevant guidance', () => {
      expect(adapter.notes.length).toBeGreaterThan(0);
      expect(adapter.notes.some(n => n.toLowerCase().includes('simpler') || n.toLowerCase().includes('shorter'))).toBeTrue();
    });

    it('should have google logo icon', () => {
      expect(adapter.icon).toBe('logo-google');
    });

    it('should only support jobs search type', () => {
      expect(adapter.supportedSearchTypes).toEqual(['jobs']);
      expect(adapter.supportedSearchTypes.length).toBe(1);
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

  describe('signals', () => {
    describe('includeLocationKeyword', () => {
      it('should default to true', () => {
        const freshAdapter = new GoogleJobsPlatformAdapter();
        expect(freshAdapter.includeLocationKeyword()).toBeTrue();
      });

      it('should be toggleable', () => {
        adapter.includeLocationKeyword.set(false);
        expect(adapter.includeLocationKeyword()).toBeFalse();
        adapter.includeLocationKeyword.set(true);
        expect(adapter.includeLocationKeyword()).toBeTrue();
      });
    });

    describe('skillsJoiner', () => {
      it('should default to OR', () => {
        const freshAdapter = new GoogleJobsPlatformAdapter();
        expect(freshAdapter.skillsJoiner()).toBe('OR');
      });

      it('should be changeable to AND', () => {
        adapter.skillsJoiner.set('AND');
        expect(adapter.skillsJoiner()).toBe('AND');
      });
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

    describe('location handling', () => {
      it('should include location when toggle enabled', () => {
        adapter.includeLocationKeyword.set(true);
        const result = adapter.buildQuery(createPayload({
          titles: ['Developer'],
          location: 'Cairo'
        }));
        expect(result.query).toContain('Cairo');
      });

      it('should exclude location when toggle disabled', () => {
        adapter.includeLocationKeyword.set(false);
        const result = adapter.buildQuery(createPayload({
          titles: ['Developer'],
          location: 'Cairo'
        }));
        expect(result.query).not.toContain('Cairo');
      });

      it('should handle empty location', () => {
        adapter.includeLocationKeyword.set(true);
        const result = adapter.buildQuery(createPayload({
          titles: ['Developer'],
          location: ''
        }));
        expect(result.query).toBe('(Developer)');
      });
    });

    describe('skills joiner', () => {
      it('should use OR for skills by default', () => {
        adapter.skillsJoiner.set('OR');
        const result = adapter.buildQuery(createPayload({
          skills: ['Angular', 'React']
        }));
        expect(result.query).toContain('Angular OR React');
      });

      it('should use AND for skills when toggle changed', () => {
        adapter.skillsJoiner.set('AND');
        const result = adapter.buildQuery(createPayload({
          skills: ['Angular', 'React']
        }));
        expect(result.query).toContain('Angular AND React');
      });

      it('should wrap OR skills in parentheses', () => {
        adapter.skillsJoiner.set('OR');
        const result = adapter.buildQuery(createPayload({
          skills: ['Angular', 'React']
        }));
        expect(result.query).toBe('(Angular OR React)');
      });

      it('should NOT wrap AND skills in extra parentheses', () => {
        adapter.skillsJoiner.set('AND');
        const result = adapter.buildQuery(createPayload({
          skills: ['Angular', 'React']
        }));
        expect(result.query).toBe('Angular AND React');
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
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer', 'Engineer']
      }));
      expect(result.query).toBe('(Developer OR Engineer)');
    });

    it('should quote multi-word titles', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Software Engineer', 'Developer']
      }));
      expect(result.query).toBe('("Software Engineer" OR Developer)');
    });

    it('should combine all clauses', () => {
      adapter.includeLocationKeyword.set(true);
      adapter.skillsJoiner.set('OR');
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer'],
        skills: ['Angular'],
        exclude: ['Junior'],
        location: 'Cairo'
      }));
      expect(result.query).toBe('(Developer) AND (Angular) AND Cairo -Junior');
    });

    it('should add Google Jobs-specific warning', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer']
      }));
      expect(result.warnings.some(w => w.toLowerCase().includes('google jobs'))).toBeTrue();
    });

    it('should warn about complex queries', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['A', 'B', 'C', 'D', 'E', 'F'],
        skills: ['G', 'H', 'I', 'J', 'K', 'L']
      }));
      expect(result.warnings.some(w => w.toLowerCase().includes('shorter') || w.toLowerCase().includes('reducing'))).toBeTrue();
    });

    it('should return safe badge status for simple queries', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer']
      }));
      expect(result.badgeStatus).toBe('safe');
    });

    it('should return warning badge status for complex queries', () => {
      // Need more than 10 operators to trigger warning threshold
      const result = adapter.buildQuery(createPayload({
        titles: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
      }));
      expect(result.badgeStatus).toBe('warning');
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

    it('should include ibp=htl;jobs parameter', () => {
      const url = adapter.buildUrl(createPayload(), 'Angular Developer');
      expect(url).toContain('ibp=htl;jobs');
    });

    it('should build Google search URL', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer');
      expect(url).toContain('google.com/search');
    });

    it('should include q parameter', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer AND Angular');
      expect(url).toContain('q=');
    });

    it('should encode query properly', () => {
      const url = adapter.buildUrl(createPayload(), '"Senior Developer"');
      expect(url).toContain('q=');
      // URLSearchParams encodes quotes
      expect(url).toContain('%22Senior');
    });

    it('should produce valid URL format with jobs parameter', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer');
      expect(url).toMatch(/^https:\/\/www\.google\.com\/search\?q=.*&ibp=htl;jobs$/);
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

    it('should warn about long queries', () => {
      const longQuery = 'a'.repeat(2100);
      const result = adapter.validate(createPayload(), longQuery);
      expect(result.warnings.some(w => w.includes('length'))).toBeTrue();
    });

    it('should warn about simpler queries', () => {
      const result = adapter.validate(createPayload(), 'Developer');
      expect(result.warnings.some(w => w.toLowerCase().includes('simpler'))).toBeTrue();
    });

    it('should warn about complex queries', () => {
      // Create a query with many operators
      const complexQuery = 'A OR B OR C OR D OR E OR F OR G OR H OR I OR J OR K OR L';
      const result = adapter.validate(createPayload(), complexQuery);
      expect(result.warnings.some(w => w.includes('complexity'))).toBeTrue();
    });

    it('should always return isValid true (no hard errors)', () => {
      const result = adapter.validate(createPayload(), 'a'.repeat(3000));
      expect(result.isValid).toBeTrue();
      expect(result.errors.length).toBe(0);
    });
  });
});
