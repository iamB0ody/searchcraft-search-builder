import {
  buildBooleanQuery,
  deduplicateCaseInsensitive,
  formatValue,
  detectUnsupportedChars,
  countOperators,
  normalizeQuery,
  QueryBuildOptions
} from './query-builder.util';
import { QueryPayload } from '../../models/platform.model';

describe('query-builder.util', () => {
  describe('deduplicateCaseInsensitive', () => {
    it('should remove duplicate items case-insensitively', () => {
      const result = deduplicateCaseInsensitive(['Apple', 'apple', 'APPLE']);
      expect(result).toEqual(['Apple']);
    });

    it('should preserve original casing of first occurrence', () => {
      const result = deduplicateCaseInsensitive(['TypeScript', 'typescript', 'TYPESCRIPT']);
      expect(result).toEqual(['TypeScript']);
    });

    it('should handle empty array', () => {
      const result = deduplicateCaseInsensitive([]);
      expect(result).toEqual([]);
    });

    it('should trim whitespace', () => {
      const result = deduplicateCaseInsensitive(['  Angular  ', 'Angular']);
      expect(result).toEqual(['Angular']);
    });

    it('should filter out empty strings', () => {
      const result = deduplicateCaseInsensitive(['', '  ', 'Valid']);
      expect(result).toEqual(['Valid']);
    });

    it('should handle mixed duplicates', () => {
      const result = deduplicateCaseInsensitive(['React', 'Angular', 'react', 'Vue']);
      expect(result).toEqual(['React', 'Angular', 'Vue']);
    });
  });

  describe('formatValue', () => {
    it('should return single word without quotes', () => {
      expect(formatValue('Developer')).toBe('Developer');
    });

    it('should quote multi-word values', () => {
      expect(formatValue('Software Engineer')).toBe('"Software Engineer"');
    });

    it('should quote values with commas', () => {
      expect(formatValue('React,Redux')).toBe('"React,Redux"');
    });

    it('should quote values with parentheses', () => {
      expect(formatValue('C(++)')).toBe('"C(++)"');
    });

    it('should trim whitespace before formatting', () => {
      expect(formatValue('  Developer  ')).toBe('Developer');
    });
  });

  describe('detectUnsupportedChars', () => {
    it('should detect asterisk wildcard', () => {
      expect(detectUnsupportedChars('Dev*')).toContain('*');
    });

    it('should detect curly braces', () => {
      const result = detectUnsupportedChars('test{value}');
      expect(result).toContain('{');
      expect(result).toContain('}');
    });

    it('should detect square brackets', () => {
      const result = detectUnsupportedChars('test[0]');
      expect(result).toContain('[');
      expect(result).toContain(']');
    });

    it('should detect angle brackets', () => {
      const result = detectUnsupportedChars('List<String>');
      expect(result).toContain('<');
      expect(result).toContain('>');
    });

    it('should return empty array for clean values', () => {
      expect(detectUnsupportedChars('Developer')).toEqual([]);
    });
  });

  describe('countOperators', () => {
    it('should count AND operators', () => {
      expect(countOperators('A AND B AND C')).toBe(2);
    });

    it('should count OR operators', () => {
      expect(countOperators('A OR B OR C')).toBe(2);
    });

    it('should count NOT operators', () => {
      expect(countOperators('NOT A NOT B')).toBe(2);
    });

    it('should count minus operators for Google/Indeed style', () => {
      expect(countOperators('-term1 -term2')).toBe(2);
    });

    it('should count all operators combined', () => {
      expect(countOperators('A AND B OR C NOT D')).toBe(3);
    });

    it('should be case-insensitive', () => {
      expect(countOperators('a and b or c not d')).toBe(3);
    });

    it('should return 0 for empty string', () => {
      expect(countOperators('')).toBe(0);
    });
  });

  describe('normalizeQuery', () => {
    it('should trim whitespace', () => {
      expect(normalizeQuery('  query  ')).toBe('query');
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeQuery('A   AND   B')).toBe('A AND B');
    });

    it('should remove leading AND', () => {
      expect(normalizeQuery('AND A AND B')).toBe('A AND B');
    });

    it('should remove trailing AND', () => {
      expect(normalizeQuery('A AND B AND')).toBe('A AND B');
    });
  });

  describe('buildBooleanQuery', () => {
    const createPayload = (overrides: Partial<QueryPayload> = {}): QueryPayload => ({
      searchType: 'people',
      titles: [],
      skills: [],
      exclude: [],
      ...overrides
    });

    const linkedInOptions: QueryBuildOptions = {
      notOperator: 'NOT',
      wrapGroups: true,
      uppercaseOperators: true
    };

    const googleOptions: QueryBuildOptions = {
      notOperator: '-',
      sitePrefix: 'site:linkedin.com/in',
      wrapGroups: true,
      uppercaseOperators: true
    };

    describe('titles clause (OR joined)', () => {
      it('should return empty string for empty titles', () => {
        const result = buildBooleanQuery(createPayload({ titles: [] }), linkedInOptions);
        expect(result.query).toBe('');
      });

      it('should wrap single title in parentheses', () => {
        const result = buildBooleanQuery(createPayload({ titles: ['Developer'] }), linkedInOptions);
        expect(result.query).toBe('(Developer)');
      });

      it('should join multiple titles with OR', () => {
        const result = buildBooleanQuery(
          createPayload({ titles: ['Developer', 'Engineer'] }),
          linkedInOptions
        );
        expect(result.query).toBe('(Developer OR Engineer)');
      });

      it('should quote multi-word titles', () => {
        const result = buildBooleanQuery(
          createPayload({ titles: ['Software Engineer', 'Frontend Developer'] }),
          linkedInOptions
        );
        expect(result.query).toBe('("Software Engineer" OR "Frontend Developer")');
      });
    });

    describe('skills clause (AND joined)', () => {
      it('should wrap single skill in parentheses', () => {
        const result = buildBooleanQuery(createPayload({ skills: ['Angular'] }), linkedInOptions);
        expect(result.query).toBe('(Angular)');
      });

      it('should join multiple skills with AND', () => {
        const result = buildBooleanQuery(
          createPayload({ skills: ['Angular', 'TypeScript'] }),
          linkedInOptions
        );
        expect(result.query).toBe('(Angular AND TypeScript)');
      });
    });

    describe('exclude clause', () => {
      it('should use NOT prefix for LinkedIn style', () => {
        const result = buildBooleanQuery(
          createPayload({ exclude: ['Junior', 'Intern'] }),
          linkedInOptions
        );
        expect(result.query).toBe('NOT Junior NOT Intern');
      });

      it('should use - prefix for Google style', () => {
        const result = buildBooleanQuery(
          createPayload({ exclude: ['Junior', 'Intern'] }),
          { ...linkedInOptions, notOperator: '-' }
        );
        expect(result.query).toBe('-Junior -Intern');
      });

      it('should quote multi-word excludes', () => {
        const result = buildBooleanQuery(
          createPayload({ exclude: ['Junior Developer'] }),
          linkedInOptions
        );
        expect(result.query).toBe('NOT "Junior Developer"');
      });
    });

    describe('combined clauses', () => {
      it('should combine titles and skills with AND', () => {
        const result = buildBooleanQuery(
          createPayload({
            titles: ['Developer', 'Engineer'],
            skills: ['Angular', 'TypeScript']
          }),
          linkedInOptions
        );
        expect(result.query).toBe('(Developer OR Engineer) AND (Angular AND TypeScript)');
      });

      it('should append exclude clause without AND', () => {
        const result = buildBooleanQuery(
          createPayload({
            titles: ['Developer'],
            exclude: ['Junior']
          }),
          linkedInOptions
        );
        expect(result.query).toBe('(Developer) NOT Junior');
      });

      it('should combine all clauses correctly', () => {
        const result = buildBooleanQuery(
          createPayload({
            titles: ['Developer', 'Engineer'],
            skills: ['Angular', 'TypeScript'],
            exclude: ['Junior', 'Intern']
          }),
          linkedInOptions
        );
        expect(result.query).toBe('(Developer OR Engineer) AND (Angular AND TypeScript) NOT Junior NOT Intern');
      });
    });

    describe('site prefix', () => {
      it('should add site prefix when specified', () => {
        const result = buildBooleanQuery(
          createPayload({ titles: ['Developer'] }),
          googleOptions
        );
        expect(result.query).toBe('site:linkedin.com/in (Developer)');
      });

      it('should not add prefix to empty query', () => {
        const result = buildBooleanQuery(createPayload(), googleOptions);
        expect(result.query).toBe('');
      });
    });

    describe('operator counting', () => {
      it('should count OR operators', () => {
        const result = buildBooleanQuery(
          createPayload({ titles: ['A', 'B', 'C'] }),
          linkedInOptions
        );
        expect(result.operatorCount).toBe(2);
      });

      it('should count AND operators', () => {
        const result = buildBooleanQuery(
          createPayload({ skills: ['A', 'B', 'C'] }),
          linkedInOptions
        );
        expect(result.operatorCount).toBe(2);
      });

      it('should count NOT operators', () => {
        const result = buildBooleanQuery(
          createPayload({ exclude: ['A', 'B'] }),
          linkedInOptions
        );
        expect(result.operatorCount).toBe(2);
      });

      it('should count minus operators', () => {
        const result = buildBooleanQuery(
          createPayload({ exclude: ['A', 'B'] }),
          { ...linkedInOptions, notOperator: '-' }
        );
        expect(result.operatorCount).toBe(2);
      });

      it('should count AND between clauses', () => {
        const result = buildBooleanQuery(
          createPayload({
            titles: ['A', 'B'],
            skills: ['X', 'Y']
          }),
          linkedInOptions
        );
        // 1 OR + 1 AND in skills + 1 AND joining clauses = 3
        expect(result.operatorCount).toBe(3);
      });
    });

    describe('warnings', () => {
      it('should warn about unsupported characters', () => {
        const result = buildBooleanQuery(
          createPayload({ titles: ['Dev*'] }),
          linkedInOptions
        );
        expect(result.warnings.some(w => w.includes('Unsupported characters'))).toBeTrue();
      });

      it('should warn when exceeding operator threshold', () => {
        const result = buildBooleanQuery(
          createPayload({
            titles: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
            skills: ['X', 'Y', 'Z']
          }),
          { ...linkedInOptions, operatorWarningThreshold: 10 }
        );
        expect(result.warnings.some(w => w.includes('Consider simplifying'))).toBeTrue();
      });

      it('should warn when exceeding operator limit', () => {
        const result = buildBooleanQuery(
          createPayload({
            titles: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
            skills: ['X', 'Y', 'Z', 'W', 'V']
          }),
          { ...linkedInOptions, operatorLimit: 10 }
        );
        expect(result.warnings.some(w => w.includes('exceeds'))).toBeTrue();
      });

      it('should warn about long queries', () => {
        const result = buildBooleanQuery(
          createPayload({
            titles: ['Very Long Title That Takes Up Space', 'Another Long Title Here']
          }),
          { ...linkedInOptions, queryLengthWarning: 50 }
        );
        expect(result.warnings.some(w => w.includes('too long'))).toBeTrue();
      });
    });

    describe('badge status', () => {
      it('should return safe for simple queries', () => {
        const result = buildBooleanQuery(
          createPayload({ titles: ['Developer'] }),
          linkedInOptions
        );
        expect(result.badgeStatus).toBe('safe');
      });

      it('should return warning when approaching threshold', () => {
        const result = buildBooleanQuery(
          createPayload({
            titles: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
          }),
          { ...linkedInOptions, operatorWarningThreshold: 8 }
        );
        expect(result.badgeStatus).toBe('warning');
      });

      it('should return danger when exceeding limit', () => {
        const result = buildBooleanQuery(
          createPayload({
            titles: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
          }),
          { ...linkedInOptions, operatorLimit: 5 }
        );
        expect(result.badgeStatus).toBe('danger');
      });
    });

    describe('deduplication', () => {
      it('should deduplicate titles case-insensitively', () => {
        const result = buildBooleanQuery(
          createPayload({ titles: ['Developer', 'developer', 'DEVELOPER'] }),
          linkedInOptions
        );
        expect(result.query).toBe('(Developer)');
      });

      it('should deduplicate skills case-insensitively', () => {
        const result = buildBooleanQuery(
          createPayload({ skills: ['Angular', 'angular', 'ANGULAR'] }),
          linkedInOptions
        );
        expect(result.query).toBe('(Angular)');
      });

      it('should deduplicate excludes case-insensitively', () => {
        const result = buildBooleanQuery(
          createPayload({ exclude: ['Junior', 'junior'] }),
          linkedInOptions
        );
        expect(result.query).toBe('NOT Junior');
      });
    });
  });
});
