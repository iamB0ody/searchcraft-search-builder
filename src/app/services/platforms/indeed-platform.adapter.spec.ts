import { TestBed } from '@angular/core/testing';
import { IndeedPlatformAdapter, INDEED_REGIONS, getIndeedRegionOptions } from './indeed-platform.adapter';
import { QueryPayload, IndeedRegion } from '../../models/platform.model';

describe('IndeedPlatformAdapter', () => {
  let adapter: IndeedPlatformAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    adapter = TestBed.inject(IndeedPlatformAdapter);
    // Reset to default state
    adapter.currentRegion.set('com');
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  describe('static properties', () => {
    it('should have correct id', () => {
      expect(adapter.id).toBe('indeed');
    });

    it('should have correct label', () => {
      expect(adapter.label).toBe('Indeed');
    });

    it('should have description', () => {
      expect(adapter.description).toContain('Indeed');
    });

    it('should have notes array', () => {
      expect(adapter.notes.length).toBeGreaterThan(0);
      expect(adapter.notes.some(n => n.includes('minus') || n.includes('-'))).toBeTrue();
    });

    it('should have briefcase icon', () => {
      expect(adapter.icon).toBe('briefcase');
    });

    it('should only support jobs search', () => {
      expect(adapter.supportedSearchTypes).toEqual(['jobs']);
    });
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const caps = adapter.getCapabilities();
      expect(caps.supportsBoolean).toBeTrue();
      expect(caps.supportsParentheses).toBeTrue();
      expect(caps.supportsQuotes).toBeTrue();
      expect(caps.supportsNot).toBeFalse(); // Indeed uses - instead
      expect(caps.maxOperators).toBeUndefined();
      expect(caps.maxQueryLength).toBe(1000);
    });
  });

  describe('INDEED_REGIONS', () => {
    it('should have United States region', () => {
      expect(INDEED_REGIONS['com']).toBeDefined();
      expect(INDEED_REGIONS['com'].domain).toBe('indeed.com');
      expect(INDEED_REGIONS['com'].label).toBe('United States');
    });

    it('should have United Kingdom region', () => {
      expect(INDEED_REGIONS['co.uk']).toBeDefined();
      expect(INDEED_REGIONS['co.uk'].domain).toBe('indeed.co.uk');
    });

    it('should have Germany region', () => {
      expect(INDEED_REGIONS['de']).toBeDefined();
      expect(INDEED_REGIONS['de'].domain).toBe('de.indeed.com');
    });

    it('should have France region', () => {
      expect(INDEED_REGIONS['fr']).toBeDefined();
      expect(INDEED_REGIONS['fr'].domain).toBe('fr.indeed.com');
    });

    it('should have Canada region', () => {
      expect(INDEED_REGIONS['ca']).toBeDefined();
      expect(INDEED_REGIONS['ca'].domain).toBe('indeed.ca');
    });

    it('should have India region', () => {
      expect(INDEED_REGIONS['in']).toBeDefined();
      expect(INDEED_REGIONS['in'].domain).toBe('indeed.co.in');
    });

    it('should have Australia region', () => {
      expect(INDEED_REGIONS['au']).toBeDefined();
      expect(INDEED_REGIONS['au'].domain).toBe('au.indeed.com');
    });

    it('should have 63 regions total', () => {
      expect(Object.keys(INDEED_REGIONS).length).toBe(63);
    });
  });

  describe('getIndeedRegionOptions', () => {
    it('should return array of region options', () => {
      const options = getIndeedRegionOptions();
      expect(Array.isArray(options)).toBeTrue();
      expect(options.length).toBe(63);
    });

    it('should have value and label for each option', () => {
      const options = getIndeedRegionOptions();
      options.forEach(option => {
        expect(option.value).toBeDefined();
        expect(option.label).toBeDefined();
      });
    });

    it('should include United States option', () => {
      const options = getIndeedRegionOptions();
      const usOption = options.find(o => o.value === 'com');
      expect(usOption).toBeDefined();
      expect(usOption?.label).toBe('United States');
    });
  });

  describe('currentRegion signal', () => {
    it('should default to com (United States)', () => {
      const freshAdapter = new IndeedPlatformAdapter();
      expect(freshAdapter.currentRegion()).toBe('com');
    });

    it('should be changeable', () => {
      adapter.currentRegion.set('co.uk');
      expect(adapter.currentRegion()).toBe('co.uk');
    });

    it('should accept all valid regions', () => {
      const regions: IndeedRegion[] = [
        // Americas
        'ar', 'br', 'ca', 'cl', 'co', 'com', 'ec', 'mx', 'pe', 've',
        // Europe
        'at', 'be', 'ch', 'co.uk', 'cz', 'de', 'dk', 'es', 'fi', 'fr',
        'gr', 'hu', 'ie', 'it', 'lu', 'nl', 'no', 'pl', 'pt', 'ro',
        'ru', 'se', 'sk', 'tr', 'ua',
        // Asia-Pacific
        'au', 'bd', 'cn', 'hk', 'id', 'in', 'jp', 'kr', 'my', 'nz',
        'pk', 'ph', 'sg', 'th', 'tw', 'vn',
        // Middle East & Africa
        'ae', 'bh', 'eg', 'il', 'ke', 'kw', 'ma', 'ng', 'om', 'qa', 'sa', 'za'
      ];
      expect(regions.length).toBe(63);
      regions.forEach(region => {
        adapter.currentRegion.set(region);
        expect(adapter.currentRegion()).toBe(region);
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

    it('should build OR clause for titles', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer', 'Engineer']
      }));
      expect(result.query).toBe('(Developer OR Engineer)');
    });

    it('should build AND clause for skills', () => {
      const result = adapter.buildQuery(createPayload({
        skills: ['Python', 'Django']
      }));
      expect(result.query).toBe('(Python AND Django)');
    });

    describe('exclusion format', () => {
      it('should use minus (-) prefix for exclusions', () => {
        const result = adapter.buildQuery(createPayload({
          exclude: ['Junior', 'Entry']
        }));
        expect(result.query).toContain('-Junior');
        expect(result.query).toContain('-Entry');
        expect(result.query).not.toContain('NOT');
      });

      it('should quote multi-word exclusions with minus', () => {
        const result = adapter.buildQuery(createPayload({
          exclude: ['Entry Level']
        }));
        expect(result.query).toContain('-"Entry Level"');
      });
    });

    it('should combine all clauses', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer'],
        skills: ['Python'],
        exclude: ['Junior']
      }));
      expect(result.query).toBe('(Developer) AND (Python) -Junior');
    });

    it('should add Indeed-specific warning', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer']
      }));
      expect(result.warnings.some(w => w.includes('Indeed'))).toBeTrue();
    });

    it('should return safe badge status for simple queries', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer']
      }));
      expect(result.badgeStatus).toBe('safe');
    });

    it('should NOT add site prefix (Indeed-specific)', () => {
      const result = adapter.buildQuery(createPayload({
        titles: ['Developer']
      }));
      expect(result.query).not.toContain('site:');
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

    describe('regional domains', () => {
      it('should use indeed.com for US region', () => {
        adapter.currentRegion.set('com');
        const url = adapter.buildUrl(createPayload(), 'Developer');
        expect(url).toContain('indeed.com/jobs');
      });

      it('should use indeed.co.uk for UK region', () => {
        adapter.currentRegion.set('co.uk');
        const url = adapter.buildUrl(createPayload(), 'Developer');
        expect(url).toContain('indeed.co.uk/jobs');
      });

      it('should use de.indeed.com for Germany region', () => {
        adapter.currentRegion.set('de');
        const url = adapter.buildUrl(createPayload(), 'Developer');
        expect(url).toContain('de.indeed.com/jobs');
      });

      it('should use fr.indeed.com for France region', () => {
        adapter.currentRegion.set('fr');
        const url = adapter.buildUrl(createPayload(), 'Developer');
        expect(url).toContain('fr.indeed.com/jobs');
      });

      it('should use indeed.ca for Canada region', () => {
        adapter.currentRegion.set('ca');
        const url = adapter.buildUrl(createPayload(), 'Developer');
        expect(url).toContain('indeed.ca/jobs');
      });

      it('should use indeed.co.in for India region', () => {
        adapter.currentRegion.set('in');
        const url = adapter.buildUrl(createPayload(), 'Developer');
        expect(url).toContain('indeed.co.in/jobs');
      });

      it('should use au.indeed.com for Australia region', () => {
        adapter.currentRegion.set('au');
        const url = adapter.buildUrl(createPayload(), 'Developer');
        expect(url).toContain('au.indeed.com/jobs');
      });
    });

    it('should include q parameter', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer AND Python');
      expect(url).toContain('q=');
    });

    it('should encode query properly', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer AND Python');
      // URLSearchParams uses + for spaces, which is valid
      expect(url).toContain('q=Developer+AND+Python');
    });

    describe('location parameter', () => {
      it('should include l parameter when location is provided', () => {
        const url = adapter.buildUrl(
          createPayload({ location: 'New York, NY' }),
          'Developer'
        );
        expect(url).toContain('l=');
        // URLSearchParams uses + for spaces
        expect(url).toContain('New+York');
      });

      it('should NOT include l parameter when location is empty', () => {
        const url = adapter.buildUrl(
          createPayload({ location: '' }),
          'Developer'
        );
        expect(url).not.toContain('l=');
      });

      it('should trim whitespace from location', () => {
        const url = adapter.buildUrl(
          createPayload({ location: '  San Francisco  ' }),
          'Developer'
        );
        // URLSearchParams uses + for spaces
        expect(url).toContain('San+Francisco');
      });

      it('should NOT include l parameter for whitespace-only location', () => {
        const url = adapter.buildUrl(
          createPayload({ location: '   ' }),
          'Developer'
        );
        expect(url).not.toContain('l=');
      });
    });

    it('should produce valid URL format', () => {
      const url = adapter.buildUrl(createPayload(), 'Developer');
      expect(url).toMatch(/^https:\/\/.*indeed.*\/jobs\?q=/);
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
      const result = adapter.validate(createPayload(), 'Developer AND Python');
      expect(result.isValid).toBeTrue();
    });

    it('should warn about long queries', () => {
      const longQuery = 'a'.repeat(1100);
      const result = adapter.validate(createPayload(), longQuery);
      expect(result.warnings.some(w => w.includes('long'))).toBeTrue();
    });

    it('should include current region in warnings', () => {
      adapter.currentRegion.set('co.uk');
      const result = adapter.validate(createPayload(), 'Developer');
      expect(result.warnings.some(w => w.includes('United Kingdom'))).toBeTrue();
    });

    it('should show US region info for default', () => {
      adapter.currentRegion.set('com');
      const result = adapter.validate(createPayload(), 'Developer');
      expect(result.warnings.some(w => w.includes('United States'))).toBeTrue();
    });

    it('should always return isValid true (no hard errors)', () => {
      const result = adapter.validate(createPayload(), 'a'.repeat(2000));
      expect(result.isValid).toBeTrue();
      expect(result.errors.length).toBe(0);
    });
  });
});
