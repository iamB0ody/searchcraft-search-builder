import { TestBed } from '@angular/core/testing';
import { BooleanBuilderService } from './boolean-builder.service';
import { SearchFormModel } from '../models/search-form.model';

describe('BooleanBuilderService', () => {
  let service: BooleanBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BooleanBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('buildQuery', () => {
    const createForm = (overrides: Partial<SearchFormModel> = {}): SearchFormModel => ({
      searchType: 'people',
      titles: [],
      skills: [],
      exclude: [],
      location: '',
      mode: 'linkedin',
      sortBy: 'relevant',
      datePosted: 'any',
      jobTypes: [],
      experienceLevels: [],
      workTypes: [],
      easyApply: false,
      hasVerifications: false,
      underTenApplicants: false,
      connectionLevels: [],
      profileLanguages: [],
      firstName: '',
      lastName: '',
      keywordTitle: '',
      keywordCompany: '',
      keywordSchool: '',
      ...overrides
    });

    describe('titles clause (OR joined)', () => {
      it('should return empty string for empty titles', () => {
        const result = service.buildQuery(createForm({ titles: [] }));
        expect(result.query).toBe('');
      });

      it('should wrap single title in parentheses', () => {
        const result = service.buildQuery(createForm({ titles: ['Developer'] }));
        expect(result.query).toBe('(Developer)');
      });

      it('should wrap multiple titles in OR clause with parentheses', () => {
        const result = service.buildQuery(createForm({
          titles: ['Developer', 'Engineer']
        }));
        expect(result.query).toBe('(Developer OR Engineer)');
      });

      it('should quote multi-word titles', () => {
        const result = service.buildQuery(createForm({
          titles: ['Software Engineer', 'Frontend Developer']
        }));
        expect(result.query).toBe('("Software Engineer" OR "Frontend Developer")');
      });
    });

    describe('skills clause (AND joined)', () => {
      it('should return empty string for empty skills', () => {
        const result = service.buildQuery(createForm({ skills: [] }));
        expect(result.query).toBe('');
      });

      it('should wrap single skill in parentheses', () => {
        const result = service.buildQuery(createForm({ skills: ['Angular'] }));
        expect(result.query).toBe('(Angular)');
      });

      it('should wrap multiple skills with AND in parentheses', () => {
        const result = service.buildQuery(createForm({
          skills: ['Angular', 'TypeScript', 'RxJS']
        }));
        expect(result.query).toBe('(Angular AND TypeScript AND RxJS)');
      });

      it('should quote multi-word skills', () => {
        const result = service.buildQuery(createForm({
          skills: ['Machine Learning', 'Deep Learning']
        }));
        expect(result.query).toBe('("Machine Learning" AND "Deep Learning")');
      });
    });

    describe('exclude clause (NOT prefix)', () => {
      it('should return empty string for empty excludes', () => {
        const result = service.buildQuery(createForm({ exclude: [] }));
        expect(result.query).toBe('');
      });

      it('should prefix single exclude with NOT', () => {
        const result = service.buildQuery(createForm({ exclude: ['Junior'] }));
        expect(result.query).toBe('NOT Junior');
      });

      it('should prefix each exclude with NOT', () => {
        const result = service.buildQuery(createForm({
          exclude: ['Junior', 'Intern']
        }));
        expect(result.query).toBe('NOT Junior NOT Intern');
      });

      it('should quote multi-word excludes', () => {
        const result = service.buildQuery(createForm({
          exclude: ['Junior Developer']
        }));
        expect(result.query).toBe('NOT "Junior Developer"');
      });
    });

    describe('combined clauses', () => {
      it('should combine titles and skills with AND', () => {
        const result = service.buildQuery(createForm({
          titles: ['Developer', 'Engineer'],
          skills: ['Angular', 'TypeScript']
        }));
        expect(result.query).toBe('(Developer OR Engineer) AND (Angular AND TypeScript)');
      });

      it('should append exclude clause without AND', () => {
        const result = service.buildQuery(createForm({
          titles: ['Developer'],
          exclude: ['Junior']
        }));
        expect(result.query).toBe('(Developer) NOT Junior');
      });

      it('should combine all clauses correctly', () => {
        const result = service.buildQuery(createForm({
          titles: ['Developer', 'Engineer'],
          skills: ['Angular', 'TypeScript'],
          exclude: ['Junior', 'Intern']
        }));
        expect(result.query).toBe('(Developer OR Engineer) AND (Angular AND TypeScript) NOT Junior NOT Intern');
      });
    });

    describe('deduplication', () => {
      it('should deduplicate titles case-insensitively', () => {
        const result = service.buildQuery(createForm({
          titles: ['Developer', 'developer', 'DEVELOPER']
        }));
        expect(result.query).toBe('(Developer)');
      });

      it('should preserve original casing of first occurrence', () => {
        const result = service.buildQuery(createForm({
          skills: ['TypeScript', 'typescript']
        }));
        expect(result.query).toBe('(TypeScript)');
      });

      it('should deduplicate across multiple values', () => {
        const result = service.buildQuery(createForm({
          skills: ['Angular', 'angular', 'React', 'ANGULAR']
        }));
        expect(result.query).toBe('(Angular AND React)');
      });
    });

    describe('unsupported characters', () => {
      it('should warn about asterisk wildcard with proper format', () => {
        const result = service.buildQuery(createForm({
          titles: ['Dev*']
        }));
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0]).toContain('Unsupported characters detected in "Dev*"');
        expect(result.warnings[0]).toContain('LinkedIn may ignore them');
      });

      it('should warn about curly braces', () => {
        const result = service.buildQuery(createForm({
          skills: ['test{value}']
        }));
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0]).toContain('Unsupported characters detected');
      });

      it('should warn about square brackets', () => {
        const result = service.buildQuery(createForm({
          skills: ['test[value]']
        }));
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0]).toContain('Unsupported characters detected');
      });

      it('should warn about angle brackets', () => {
        const result = service.buildQuery(createForm({
          skills: ['C<test>']
        }));
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings.some(w => w.includes('Unsupported characters detected'))).toBeTrue();
      });

      it('should keep the value despite warning', () => {
        const result = service.buildQuery(createForm({
          titles: ['Dev*']
        }));
        expect(result.query).toBe('(Dev*)');
      });
    });

    describe('operator counting', () => {
      it('should count OR operators', () => {
        const result = service.buildQuery(createForm({
          titles: ['A', 'B', 'C']
        }));
        expect(result.operatorCount).toBe(2); // 2 ORs
      });

      it('should count AND operators', () => {
        const result = service.buildQuery(createForm({
          skills: ['A', 'B', 'C']
        }));
        expect(result.operatorCount).toBe(2); // 2 ANDs
      });

      it('should count NOT operators', () => {
        const result = service.buildQuery(createForm({
          exclude: ['A', 'B']
        }));
        expect(result.operatorCount).toBe(2); // 2 NOTs
      });

      it('should count all operators combined', () => {
        const result = service.buildQuery(createForm({
          titles: ['A', 'B'],    // 1 OR
          skills: ['X', 'Y'],    // 1 AND + 1 AND (joining with titles)
          exclude: ['Z']         // 1 NOT
        }));
        expect(result.operatorCount).toBeGreaterThanOrEqual(4);
      });
    });

    describe('Sales Navigator warnings', () => {
      it('should warn when operators exceed 15 in Sales Navigator mode', () => {
        // 10 titles = 9 ORs, 8 skills = 7 ANDs + 1 AND joining = 17 operators
        const result = service.buildQuery(createForm({
          mode: 'salesnav',
          titles: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
          skills: ['X', 'Y', 'Z', 'W', 'V', 'U', 'T', 'S']
        }));
        expect(result.operatorCount).toBeGreaterThan(15);
        expect(result.warnings.some(w => w.includes('Sales Navigator supports up to 15 Boolean operators'))).toBeTrue();
        expect(result.badgeStatus).toBe('danger');
      });

      it('should show warning badge when approaching limit (12-15 operators)', () => {
        // 8 titles = 7 ORs, 5 skills = 4 ANDs + 1 AND joining = 12 operators
        const result = service.buildQuery(createForm({
          mode: 'salesnav',
          titles: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
          skills: ['X', 'Y', 'Z', 'W', 'V']
        }));
        expect(result.operatorCount).toBeGreaterThanOrEqual(12);
        expect(result.badgeStatus).toBe('warning');
      });

      it('should not warn for LinkedIn mode with many operators (Sales Nav specific)', () => {
        const result = service.buildQuery(createForm({
          mode: 'linkedin',
          titles: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
          skills: ['X', 'Y', 'Z', 'W', 'V', 'U', 'T', 'S']
        }));
        expect(result.warnings.some(w => w.includes('Sales Navigator'))).toBeFalse();
      });
    });

    describe('LinkedIn warnings', () => {
      it('should warn for long LinkedIn queries', () => {
        const result = service.buildQuery(createForm({
          mode: 'linkedin',
          titles: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
        }));
        expect(result.warnings.some(w => w.includes('LinkedIn search may limit'))).toBeTrue();
        expect(result.badgeStatus).toBe('warning');
      });

      it('should not warn for Recruiter mode', () => {
        const result = service.buildQuery(createForm({
          mode: 'recruiter',
          titles: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P']
        }));
        expect(result.warnings.some(w => w.includes('Sales Navigator'))).toBeFalse();
        expect(result.warnings.some(w => w.includes('LinkedIn search may limit'))).toBeFalse();
        expect(result.badgeStatus).toBe('safe');
      });
    });

    describe('query normalization', () => {
      it('should trim whitespace', () => {
        const result = service.buildQuery(createForm({
          titles: ['  Developer  ']
        }));
        expect(result.query).toBe('(Developer)');
      });

      it('should collapse multiple spaces', () => {
        const result = service.buildQuery(createForm({
          titles: ['Software   Engineer']
        }));
        expect(result.query).toBe('("Software Engineer")');
      });

      it('should handle empty arrays without producing AND', () => {
        const result = service.buildQuery(createForm({
          titles: [],
          skills: ['Angular']
        }));
        expect(result.query).toBe('(Angular)');
        expect(result.query).not.toMatch(/^\s*AND/);
      });
    });

    describe('badge status', () => {
      it('should return safe badge for simple queries', () => {
        const result = service.buildQuery(createForm({
          mode: 'linkedin',
          titles: ['Developer']
        }));
        expect(result.badgeStatus).toBe('safe');
      });

      it('should return safe badge for recruiter mode regardless of complexity', () => {
        const result = service.buildQuery(createForm({
          mode: 'recruiter',
          titles: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
          skills: ['X', 'Y', 'Z', 'W', 'V', 'U', 'T', 'S']
        }));
        expect(result.badgeStatus).toBe('safe');
      });
    });
  });
});
