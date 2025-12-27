import { TestBed } from '@angular/core/testing';
import { QualityScoreService } from './quality-score.service';
import { QualityScoreInput } from '../models/quality-score.model';

describe('QualityScoreService', () => {
  let service: QualityScoreService;

  const baseInput: QualityScoreInput = {
    titles: ['Software Engineer'],
    skills: ['JavaScript'],
    exclude: [],
    booleanQuery: '("Software Engineer") AND (JavaScript)',
    operatorCount: 2,
    warnings: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QualityScoreService);
  });

  describe('empty search handling', () => {
    it('should return score 0 for empty titles and skills', () => {
      const input: QualityScoreInput = {
        titles: [],
        skills: [],
        exclude: [],
        booleanQuery: '',
        operatorCount: 0,
        warnings: []
      };

      const result = service.calculateScore(input);

      expect(result.score).toBe(0);
      expect(result.level).toBe('risky');
      expect(result.reasons[0].type).toBe('warning');
      expect(result.reasons[0].message).toContain('Add job titles or skills');
    });

    it('should return score 10 for only exclusions', () => {
      const input: QualityScoreInput = {
        titles: [],
        skills: [],
        exclude: ['Junior'],
        booleanQuery: 'NOT Junior',
        operatorCount: 1,
        warnings: []
      };

      const result = service.calculateScore(input);

      expect(result.score).toBe(10);
      expect(result.level).toBe('risky');
      expect(result.reasons[0].message).toContain('only exclusions');
    });
  });

  describe('operator count penalties', () => {
    it('should subtract 15 points for operatorCount > 20', () => {
      const input: QualityScoreInput = {
        ...baseInput,
        operatorCount: 21
      };

      const result = service.calculateScore(input);

      expect(result.score).toBe(90); // 100 + 5 (balanced) - 15
      expect(result.reasons.some(r => r.message.includes('many operators'))).toBe(true);
    });

    it('should subtract 10 points for operatorCount > 15', () => {
      const input: QualityScoreInput = {
        ...baseInput,
        operatorCount: 16
      };

      const result = service.calculateScore(input);

      expect(result.score).toBe(95); // 100 + 5 (balanced) - 10
      expect(result.reasons.some(r => r.message.includes('simplifying'))).toBe(true);
    });

    it('should not penalize for operatorCount <= 15', () => {
      const result = service.calculateScore(baseInput);

      expect(result.reasons.some(r => r.message.includes('operator'))).toBe(false);
    });
  });

  describe('AND count penalties', () => {
    it('should subtract 10 points for more than 8 ANDs', () => {
      const input: QualityScoreInput = {
        ...baseInput,
        booleanQuery: 'A AND B AND C AND D AND E AND F AND G AND H AND I AND J'
      };

      const result = service.calculateScore(input);

      expect(result.score).toBe(95); // 100 + 5 (balanced) - 10
      expect(result.reasons.some(r => r.message.includes('restrictive'))).toBe(true);
      expect(result.tips).toContain('Try using OR between similar skills');
    });

    it('should not penalize for 8 or fewer ANDs', () => {
      const input: QualityScoreInput = {
        ...baseInput,
        booleanQuery: 'A AND B AND C AND D AND E AND F AND G AND H'
      };

      const result = service.calculateScore(input);

      expect(result.reasons.some(r => r.message.includes('restrictive'))).toBe(false);
    });
  });

  describe('query length penalties', () => {
    it('should subtract 10 points for query >= 400 chars', () => {
      const input: QualityScoreInput = {
        ...baseInput,
        booleanQuery: 'x'.repeat(400)
      };

      const result = service.calculateScore(input);

      expect(result.score).toBe(95); // 100 + 5 (balanced) - 10
      expect(result.reasons.some(r => r.message.includes('exceeds recommended length'))).toBe(true);
    });

    it('should subtract 5 points for query >= 250 chars', () => {
      const input: QualityScoreInput = {
        ...baseInput,
        booleanQuery: 'x'.repeat(250)
      };

      const result = service.calculateScore(input);

      expect(result.score).toBe(100); // 100 + 5 (balanced) - 5
      expect(result.reasons.some(r => r.message.includes('platforms may truncate'))).toBe(true);
    });

    it('should not penalize for query < 250 chars', () => {
      const result = service.calculateScore(baseInput);

      expect(result.reasons.some(r => r.message.includes('length') || r.message.includes('truncate'))).toBe(false);
    });
  });

  describe('unsupported characters warning', () => {
    it('should subtract 10 points for unsupported character warning', () => {
      const input: QualityScoreInput = {
        ...baseInput,
        warnings: ['Query contains unsupported characters']
      };

      const result = service.calculateScore(input);

      expect(result.score).toBe(95); // 100 + 5 (balanced) - 10
      expect(result.reasons.some(r => r.message.includes('unsupported characters'))).toBe(true);
    });
  });

  describe('balanced search bonus', () => {
    it('should add 5 points for having both titles and skills', () => {
      const result = service.calculateScore(baseInput);

      // Score is clamped to 100 max, so 100 + 5 = 100 (clamped)
      expect(result.score).toBe(100);
    });

    it('should not add bonus for only titles', () => {
      const input: QualityScoreInput = {
        ...baseInput,
        skills: []
      };

      const result = service.calculateScore(input);

      expect(result.score).toBe(100);
    });

    it('should not add bonus for only skills', () => {
      const input: QualityScoreInput = {
        ...baseInput,
        titles: []
      };

      const result = service.calculateScore(input);

      expect(result.score).toBe(100);
    });
  });

  describe('score clamping', () => {
    it('should clamp score to max 100', () => {
      const result = service.calculateScore(baseInput);

      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should clamp score to min 0', () => {
      const input: QualityScoreInput = {
        titles: [],
        skills: [],
        exclude: [],
        booleanQuery: '',
        operatorCount: 0,
        warnings: []
      };

      const result = service.calculateScore(input);

      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('level thresholds', () => {
    it('should return "good" for score >= 70', () => {
      const result = service.calculateScore(baseInput);

      expect(result.level).toBe('good');
    });

    it('should return "ok" for score >= 40 and < 70', () => {
      // Create a scenario that results in score between 40-69
      const input: QualityScoreInput = {
        titles: ['Engineer'],
        skills: [],
        exclude: [],
        booleanQuery: 'x'.repeat(400), // -10
        operatorCount: 21, // -15
        warnings: ['unsupported chars'] // -10
      };

      const result = service.calculateScore(input);

      // Score: 100 - 10 - 15 - 10 = 65
      expect(result.score).toBe(65);
      expect(result.level).toBe('ok');
    });

    it('should return "risky" for score < 40', () => {
      const input: QualityScoreInput = {
        titles: [],
        skills: [],
        exclude: ['Test'],
        booleanQuery: 'NOT Test',
        operatorCount: 1,
        warnings: []
      };

      const result = service.calculateScore(input);

      expect(result.score).toBe(10);
      expect(result.level).toBe('risky');
    });
  });

  describe('tips generation', () => {
    it('should suggest adding exclusions when query has >2 terms and no exclusions', () => {
      const input: QualityScoreInput = {
        titles: ['Engineer', 'Developer'],
        skills: ['JavaScript'],
        exclude: [],
        booleanQuery: 'test',
        operatorCount: 3,
        warnings: []
      };

      const result = service.calculateScore(input);

      expect(result.tips).toContain('Consider adding exclusions to refine results');
    });

    it('should not suggest exclusions when already has exclusions', () => {
      const input: QualityScoreInput = {
        titles: ['Engineer', 'Developer'],
        skills: ['JavaScript'],
        exclude: ['Junior'],
        booleanQuery: 'test',
        operatorCount: 4,
        warnings: []
      };

      const result = service.calculateScore(input);

      expect(result.tips?.includes('Consider adding exclusions to refine results')).toBeFalsy();
    });
  });

  describe('combined penalties', () => {
    it('should apply multiple penalties correctly', () => {
      // 9 ANDs to trigger the > 8 penalty
      const input: QualityScoreInput = {
        titles: ['Engineer'],
        skills: ['JavaScript'],
        exclude: [],
        booleanQuery: 'A AND B AND C AND D AND E AND F AND G AND H AND I AND J'.padEnd(400, 'x'),
        operatorCount: 21,
        warnings: ['unsupported character found']
      };

      const result = service.calculateScore(input);

      // Base: 100, +5 balanced, -15 operators, -10 ANDs (>8), -10 length, -10 unsupported = 60
      expect(result.score).toBe(60);
      expect(result.level).toBe('ok');
      expect(result.reasons.length).toBe(4);
    });
  });
});
