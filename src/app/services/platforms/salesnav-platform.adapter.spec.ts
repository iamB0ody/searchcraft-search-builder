import { TestBed } from '@angular/core/testing';
import { SalesNavPlatformAdapter } from './salesnav-platform.adapter';
import { QueryPayload } from '../../models/platform.model';

describe('SalesNavPlatformAdapter', () => {
  let adapter: SalesNavPlatformAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    adapter = TestBed.inject(SalesNavPlatformAdapter);
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  describe('static properties', () => {
    it('should have correct id', () => {
      expect(adapter.id).toBe('salesnav');
    });

    it('should have correct label', () => {
      expect(adapter.label).toBe('Sales Navigator');
    });

    it('should have description', () => {
      expect(adapter.description).toContain('Sales Navigator');
    });

    it('should have notes array', () => {
      expect(adapter.notes.length).toBeGreaterThan(0);
      expect(adapter.notes.some(n => n.includes('15'))).toBeTrue();
    });

    it('should have business icon', () => {
      expect(adapter.icon).toBe('business');
    });

    it('should only support people search', () => {
      expect(adapter.supportedSearchTypes).toEqual(['people']);
    });
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const caps = adapter.getCapabilities();
      expect(caps.supportsBoolean).toBeTrue();
      expect(caps.supportsParentheses).toBeTrue();
      expect(caps.supportsQuotes).toBeTrue();
      expect(caps.supportsNot).toBeTrue();
      expect(caps.maxOperators).toBe(15);
      expect(caps.maxQueryLength).toBe(500);
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

    it('should build OR clause for titles', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer', 'Engineer']
      }));
      expect(result.query).toBe('(Developer OR Engineer)');
    });

    it('should build AND clause for skills', () => {
      const result = adapter.buildQuery(createPayload({
        skills: ['Angular', 'TypeScript']
      }));
      expect(result.query).toBe('(Angular AND TypeScript)');
    });

    it('should use NOT for exclusions', () => {
      const result = adapter.buildQuery(createPayload({
        exclude: ['Junior', 'Intern']
      }));
      expect(result.query).toBe('NOT Junior NOT Intern');
    });

    it('should combine all clauses', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer'],
        skills: ['Angular'],
        exclude: ['Junior']
      }));
      expect(result.query).toBe('(Developer) AND (Angular) NOT Junior');
    });

    describe('operator limit enforcement', () => {
      it('should warn when operators exceed 15', () => {
        const result = adapter.buildQuery(createPayload({
          titles: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
          skills: ['X', 'Y', 'Z', 'W', 'V', 'U', 'T', 'S']
        }));
        expect(result.operatorCount).toBeGreaterThan(15);
        expect(result.warnings.some(w => w.includes('Sales Navigator supports up to 15'))).toBeTrue();
      });

      it('should return danger badge when exceeding limit', () => {
        const result = adapter.buildQuery(createPayload({
          titles: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
          skills: ['X', 'Y', 'Z', 'W', 'V', 'U', 'T', 'S']
        }));
        expect(result.badgeStatus).toBe('danger');
      });

      it('should return warning badge when approaching limit (12-15)', () => {
        const result = adapter.buildQuery(createPayload({
          titles: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
          skills: ['X', 'Y', 'Z', 'W', 'V']
        }));
        expect(result.operatorCount).toBeGreaterThanOrEqual(12);
        expect(result.operatorCount).toBeLessThanOrEqual(15);
        expect(result.badgeStatus).toBe('warning');
      });

      it('should return safe badge for simple queries', () => {
        const result = adapter.buildQuery(createPayload({
          titles: ['Developer', 'Engineer']
        }));
        expect(result.badgeStatus).toBe('safe');
      });
    });

    it('should count operators correctly', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['A', 'B', 'C'],  // 2 ORs
        skills: ['X', 'Y'],       // 1 AND + 1 AND joining
        exclude: ['Z']            // 1 NOT
      }));
      expect(result.operatorCount).toBeGreaterThanOrEqual(5);
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

    it('should build LinkedIn people search URL (fallback)', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer AND Angular');
      expect(url).toContain('linkedin.com/search/results/people');
    });

    it('should include keywords parameter', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer AND Angular');
      expect(url).toContain('keywords=');
    });

    it('should encode query properly', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer AND Angular');
      // URLSearchParams uses + for spaces, which is valid
      expect(url).toContain('keywords=Developer+AND+Angular');
    });

    it('should include origin parameter', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer');
      expect(url).toContain('origin=GLOBAL_SEARCH_HEADER');
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

    it('should be valid for simple queries', () => {
      const result = adapter.validate(createPayload(), 'Developer AND Angular');
      expect(result.isValid).toBeTrue();
    });

    it('should add error when operators exceed 15', () => {
      // 16 ANDs exceeds the 15 operator limit
      const manyOperators = 'A AND B AND C AND D AND E AND F AND G AND H AND I AND J AND K AND L AND M AND N AND O AND P AND Q';
      const result = adapter.validate(createPayload(), manyOperators);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('operators');
    });

    it('should add warning when approaching limit', () => {
      // 12 ANDs is at the warning threshold (12-15)
      const nearLimit = 'A AND B AND C AND D AND E AND F AND G AND H AND I AND J AND K AND L AND M';
      const result = adapter.validate(createPayload(), nearLimit);
      expect(result.warnings.some(w => w.includes('12') || w.includes('operators'))).toBeTrue();
    });

    it('should include tip about pasting in Sales Navigator', () => {
      const result = adapter.validate(createPayload(), 'Developer');
      expect(result.warnings.some(w => w.includes('Sales Navigator search'))).toBeTrue();
    });

    it('should return isValid false when exceeding limit', () => {
      // 16 ANDs exceeds the 15 operator limit
      const manyOperators = 'A AND B AND C AND D AND E AND F AND G AND H AND I AND J AND K AND L AND M AND N AND O AND P AND Q';
      const result = adapter.validate(createPayload(), manyOperators);
      expect(result.isValid).toBeFalse();
    });
  });
});
