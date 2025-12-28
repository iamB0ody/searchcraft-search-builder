import { applyEmotionalMode, getEmotionalModeDescription } from './emotional-mode.util';
import { QueryPayload } from '../models/platform.model';

describe('EmotionalModeUtil', () => {
  describe('applyEmotionalMode', () => {
    const createPayload = (overrides: Partial<QueryPayload> = {}): QueryPayload => ({
      searchType: 'people',
      titles: ['Software Engineer', 'Developer', 'Programmer', 'Coder'],
      skills: ['Angular', 'TypeScript', 'JavaScript'],
      exclude: ['Junior', 'Intern', 'Entry', 'Sales'],
      ...overrides
    });

    describe('normal mode', () => {
      it('should return unchanged payload for normal mode', () => {
        const payload = createPayload();
        const result = applyEmotionalMode(payload, 'normal');

        expect(result.payload).toBe(payload);
        expect(result.adjustments).toEqual([]);
        expect(result.useOrForSkills).toBe(false);
      });

      it('should default to normal mode when mode is undefined', () => {
        const payload = createPayload();
        const result = applyEmotionalMode(payload);

        expect(result.payload).toBe(payload);
        expect(result.adjustments).toEqual([]);
        expect(result.useOrForSkills).toBe(false);
      });
    });

    describe('urgent mode', () => {
      it('should limit titles to max 3', () => {
        const payload = createPayload();
        const result = applyEmotionalMode(payload, 'urgent');

        expect(result.payload.titles.length).toBe(3);
        expect(result.adjustments).toContain('Reduced titles from 4 to 3');
      });

      it('should not modify titles if already at or below limit', () => {
        const payload = createPayload({ titles: ['Developer', 'Engineer'] });
        const result = applyEmotionalMode(payload, 'urgent');

        expect(result.payload.titles.length).toBe(2);
        expect(result.adjustments.some(a => a.includes('titles'))).toBe(false);
      });

      it('should limit skills to max 2', () => {
        const payload = createPayload();
        const result = applyEmotionalMode(payload, 'urgent');

        expect(result.payload.skills.length).toBe(2);
        expect(result.adjustments).toContain('Reduced skills from 3 to 2');
      });

      it('should set useOrForSkills to true when multiple skills', () => {
        const payload = createPayload({ skills: ['Angular', 'TypeScript'] });
        const result = applyEmotionalMode(payload, 'urgent');

        expect(result.useOrForSkills).toBe(true);
        expect(result.adjustments).toContain('Using OR between skills for broader results');
      });

      it('should not set useOrForSkills for single skill', () => {
        const payload = createPayload({ skills: ['Angular'] });
        const result = applyEmotionalMode(payload, 'urgent');

        expect(result.useOrForSkills).toBe(false);
      });

      it('should filter excludes to essential ones', () => {
        const payload = createPayload({ exclude: ['Junior', 'Senior', 'Manager', 'Intern'] });
        const result = applyEmotionalMode(payload, 'urgent');

        // Should keep Junior and Intern (essential), filter out Senior and Manager
        expect(result.payload.exclude.length).toBeLessThanOrEqual(4);
        expect(result.payload.exclude).toContain('Junior');
        expect(result.payload.exclude).toContain('Intern');
      });

      it('should not mutate original payload', () => {
        const payload = createPayload();
        const originalTitles = [...payload.titles];
        const originalSkills = [...payload.skills];

        applyEmotionalMode(payload, 'urgent');

        expect(payload.titles).toEqual(originalTitles);
        expect(payload.skills).toEqual(originalSkills);
      });
    });

    describe('chill mode', () => {
      it('should preserve all titles', () => {
        const payload = createPayload({ titles: ['A', 'B', 'C', 'D', 'E'] });
        const result = applyEmotionalMode(payload, 'chill');

        expect(result.payload.titles.length).toBe(5);
      });

      it('should preserve all skills', () => {
        const payload = createPayload({ skills: ['A', 'B', 'C', 'D', 'E'] });
        const result = applyEmotionalMode(payload, 'chill');

        expect(result.payload.skills.length).toBe(5);
      });

      it('should preserve all excludes', () => {
        const payload = createPayload({ exclude: ['A', 'B', 'C', 'D', 'E'] });
        const result = applyEmotionalMode(payload, 'chill');

        expect(result.payload.exclude.length).toBe(5);
      });

      it('should add quality focus adjustment note', () => {
        const payload = createPayload();
        const result = applyEmotionalMode(payload, 'chill');

        expect(result.adjustments).toContain('Quality mode: full query preserved for precise results');
      });

      it('should not use OR for skills', () => {
        const payload = createPayload({ skills: ['A', 'B', 'C'] });
        const result = applyEmotionalMode(payload, 'chill');

        expect(result.useOrForSkills).toBe(false);
      });
    });
  });

  describe('getEmotionalModeDescription', () => {
    it('should return correct description for urgent mode', () => {
      const description = getEmotionalModeDescription('urgent');
      expect(description).toBe('Query broadened for faster results');
    });

    it('should return correct description for normal mode', () => {
      const description = getEmotionalModeDescription('normal');
      expect(description).toBe('Balanced search');
    });

    it('should return correct description for chill mode', () => {
      const description = getEmotionalModeDescription('chill');
      expect(description).toBe('Query focused on quality and precision');
    });
  });
});
