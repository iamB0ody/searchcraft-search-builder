import { applyHiringSignals, getHiringSignalsSummary } from './apply-hiring-signals';
import { QueryPayload, PlatformCapabilities } from '../../models/platform.model';
import { HiringSignalId } from './hiring-signals.model';

describe('ApplyHiringSignals', () => {
  // Mock platform capabilities for LinkedIn (full boolean support)
  const linkedInCapabilities: PlatformCapabilities = {
    supportsBoolean: true,
    supportsParentheses: true,
    supportsQuotes: true,
    supportsNot: true,
    booleanLevel: 'good',
    supportsOR: true,
    supportsAND: true,
    supportsMinusExclude: false,
    region: 'global'
  };

  // Mock platform capabilities for a MENA platform (limited boolean)
  const menaCapabilities: PlatformCapabilities = {
    supportsBoolean: false,
    supportsParentheses: false,
    supportsQuotes: true,
    supportsNot: false,
    booleanLevel: 'none',
    supportsOR: false,
    supportsAND: false,
    supportsMinusExclude: false,
    region: 'mena'
  };

  const createPayload = (overrides: Partial<QueryPayload> = {}): QueryPayload => ({
    searchType: 'people',
    titles: ['Software Engineer', 'Developer'],
    skills: ['Angular', 'TypeScript'],
    exclude: ['Junior', 'Intern'],
    ...overrides
  });

  describe('applyHiringSignals', () => {
    describe('when disabled', () => {
      it('should return unchanged payload when hiringSignals is undefined', () => {
        const payload = createPayload();
        const result = applyHiringSignals(payload, linkedInCapabilities);

        expect(result.payload).toBe(payload);
        expect(result.explanation.enabled).toBe(false);
        expect(result.explanation.appliedSignals).toEqual([]);
      });

      it('should return unchanged payload when hiringSignals.enabled is false', () => {
        const payload = createPayload({
          hiringSignals: { enabled: false, selected: ['openToOpportunities'] }
        });
        const result = applyHiringSignals(payload, linkedInCapabilities);

        expect(result.payload).toBe(payload);
        expect(result.explanation.enabled).toBe(false);
      });

      it('should return unchanged payload when selected signals is empty', () => {
        const payload = createPayload({
          hiringSignals: { enabled: true, selected: [] }
        });
        const result = applyHiringSignals(payload, linkedInCapabilities);

        expect(result.payload).toBe(payload);
        expect(result.explanation.enabled).toBe(false);
      });

      it('should return unchanged payload for jobs search type', () => {
        const payload = createPayload({
          searchType: 'jobs',
          hiringSignals: { enabled: true, selected: ['openToOpportunities'] }
        });
        const result = applyHiringSignals(payload, linkedInCapabilities);

        expect(result.payload).toBe(payload);
        expect(result.explanation.enabled).toBe(false);
      });
    });

    describe('when enabled with include signals', () => {
      it('should inject include phrases into signalIncludes', () => {
        const payload = createPayload({
          hiringSignals: { enabled: true, selected: ['openToOpportunities'] }
        });
        const result = applyHiringSignals(payload, linkedInCapabilities);

        expect(result.explanation.enabled).toBe(true);
        expect(result.explanation.appliedSignals).toContain('openToOpportunities');
        expect(result.payload.signalIncludes).toBeDefined();
        expect(result.payload.signalIncludes?.length).toBeGreaterThan(0);
        expect(result.payload.signalIncludes).toContain('"open to work"');
      });

      it('should track injected includes in explanation', () => {
        const payload = createPayload({
          hiringSignals: { enabled: true, selected: ['recruiterFriendlyBio'] }
        });
        const result = applyHiringSignals(payload, linkedInCapabilities);

        expect(result.explanation.injectedIncludes.length).toBeGreaterThan(0);
        expect(result.explanation.injectedIncludes).toContain('"experience in"');
      });
    });

    describe('when enabled with exclude signals', () => {
      it('should add exclude phrases to payload.exclude', () => {
        const payload = createPayload({
          exclude: ['Sales'],
          hiringSignals: { enabled: true, selected: ['excludeStudentsInterns'] }
        });
        const result = applyHiringSignals(payload, linkedInCapabilities);

        expect(result.payload.exclude.length).toBeGreaterThan(1);
        expect(result.payload.exclude).toContain('Sales'); // Original preserved
        expect(result.payload.exclude).toContain('student');
        expect(result.payload.exclude).toContain('intern');
      });

      it('should track injected excludes in explanation', () => {
        const payload = createPayload({
          hiringSignals: { enabled: true, selected: ['excludeFreelanceOnly'] }
        });
        const result = applyHiringSignals(payload, linkedInCapabilities);

        expect(result.explanation.injectedExcludes.length).toBeGreaterThan(0);
        expect(result.explanation.injectedExcludes).toContain('freelancer');
      });

      it('should deduplicate against existing excludes', () => {
        const payload = createPayload({
          exclude: ['student', 'manager'],
          hiringSignals: { enabled: true, selected: ['excludeStudentsInterns'] }
        });
        const result = applyHiringSignals(payload, linkedInCapabilities);

        // Should not duplicate 'student'
        const studentCount = result.payload.exclude.filter(e =>
          e.toLowerCase() === 'student'
        ).length;
        expect(studentCount).toBe(1);
      });
    });

    describe('multiple signals', () => {
      it('should apply multiple signals and combine phrases', () => {
        const payload = createPayload({
          hiringSignals: {
            enabled: true,
            selected: ['openToOpportunities', 'excludeStudentsInterns']
          }
        });
        const result = applyHiringSignals(payload, linkedInCapabilities);

        expect(result.explanation.appliedSignals.length).toBe(2);
        expect(result.explanation.injectedIncludes.length).toBeGreaterThan(0);
        expect(result.explanation.injectedExcludes.length).toBeGreaterThan(0);
      });

      it('should deduplicate include phrases across signals', () => {
        const payload = createPayload({
          hiringSignals: {
            enabled: true,
            selected: ['openToOpportunities', 'recruiterFriendlyBio']
          }
        });
        const result = applyHiringSignals(payload, linkedInCapabilities);

        // No duplicates in includes
        const uniqueIncludes = [...new Set(result.explanation.injectedIncludes)];
        expect(uniqueIncludes.length).toBe(result.explanation.injectedIncludes.length);
      });
    });

    describe('immutability', () => {
      it('should not mutate the original payload', () => {
        const payload = createPayload({
          exclude: ['Sales'],
          hiringSignals: { enabled: true, selected: ['excludeStudentsInterns'] }
        });
        const originalExcludeLength = payload.exclude.length;

        applyHiringSignals(payload, linkedInCapabilities);

        expect(payload.exclude.length).toBe(originalExcludeLength);
        expect(payload.signalIncludes).toBeUndefined();
      });

      it('should create a new payload object', () => {
        const payload = createPayload({
          hiringSignals: { enabled: true, selected: ['openToOpportunities'] }
        });
        const result = applyHiringSignals(payload, linkedInCapabilities);

        expect(result.payload).not.toBe(payload);
      });
    });

    describe('warnings', () => {
      it('should warn when many signal phrases are used', () => {
        const payload = createPayload({
          hiringSignals: {
            enabled: true,
            selected: [
              'openToOpportunities',
              'recruiterFriendlyBio',
              'excludeStudentsInterns',
              'excludeFreelanceOnly',
              'growthPlateau'
            ] as HiringSignalId[]
          }
        });
        const result = applyHiringSignals(payload, linkedInCapabilities);

        expect(result.explanation.warnings.length).toBeGreaterThan(0);
        expect(result.explanation.warnings.some(w =>
          w.toLowerCase().includes('many')
        )).toBe(true);
      });

      it('should warn on non-LinkedIn platforms', () => {
        const payload = createPayload({
          hiringSignals: { enabled: true, selected: ['openToOpportunities'] }
        });
        const result = applyHiringSignals(payload, menaCapabilities);

        expect(result.explanation.warnings.some(w =>
          w.toLowerCase().includes('linkedin')
        )).toBe(true);
      });
    });
  });

  describe('getHiringSignalsSummary', () => {
    it('should return empty string when disabled', () => {
      const summary = getHiringSignalsSummary({
        enabled: false,
        appliedSignals: [],
        injectedIncludes: [],
        injectedExcludes: [],
        warnings: []
      });
      expect(summary).toBe('');
    });

    it('should return count summary when enabled with signals', () => {
      const summary = getHiringSignalsSummary({
        enabled: true,
        appliedSignals: ['openToOpportunities', 'excludeStudentsInterns'],
        injectedIncludes: ['"open to work"'],
        injectedExcludes: ['student'],
        warnings: []
      });
      expect(summary).toBe('2 hiring signals applied');
    });

    it('should use singular form for one signal', () => {
      const summary = getHiringSignalsSummary({
        enabled: true,
        appliedSignals: ['openToOpportunities'],
        injectedIncludes: ['"open to work"'],
        injectedExcludes: [],
        warnings: []
      });
      expect(summary).toBe('1 hiring signal applied');
    });
  });
});
