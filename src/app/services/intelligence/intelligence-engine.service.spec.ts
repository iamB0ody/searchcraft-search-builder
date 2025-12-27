import { TestBed } from '@angular/core/testing';
import { IntelligenceEngineService } from './intelligence-engine.service';
import { QueryPayload } from '../../models/platform.model';

describe('IntelligenceEngineService', () => {
  let service: IntelligenceEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IntelligenceEngineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('lint suggestions', () => {
    it('should suggest adding content for empty search', () => {
      const payload: QueryPayload = {
        searchType: 'people',
        titles: [],
        skills: [],
        exclude: []
      };

      const suggestions = service.generateSuggestions(payload, 0);
      const emptySuggestion = suggestions.find(s => s.id === 'lint-empty');

      expect(emptySuggestion).toBeTruthy();
      expect(emptySuggestion?.type).toBe('hint');
      expect(emptySuggestion?.title).toBe('Empty search');
    });

    it('should warn when only excludes are present', () => {
      const payload: QueryPayload = {
        searchType: 'people',
        titles: [],
        skills: [],
        exclude: ['Junior', 'Intern']
      };

      const suggestions = service.generateSuggestions(payload, 2);
      const onlyExcludes = suggestions.find(s => s.id === 'lint-only-excludes');

      expect(onlyExcludes).toBeTruthy();
      expect(onlyExcludes?.type).toBe('lint');
      expect(onlyExcludes?.severity).toBe('warning');
    });

    it('should warn when query may be too restrictive', () => {
      const payload: QueryPayload = {
        searchType: 'people',
        titles: ['Developer'],
        skills: ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'Jest', 'Cypress'],
        exclude: []
      };

      const suggestions = service.generateSuggestions(payload, 7);
      const restrictive = suggestions.find(s => s.id === 'lint-too-restrictive');

      expect(restrictive).toBeTruthy();
      expect(restrictive?.severity).toBe('warning');
      expect(restrictive?.description).toContain('6 AND conditions');
    });

    it('should note when many title variations are present', () => {
      const payload: QueryPayload = {
        searchType: 'people',
        titles: ['Dev1', 'Dev2', 'Dev3', 'Dev4', 'Dev5', 'Dev6', 'Dev7', 'Dev8', 'Dev9'],
        skills: [],
        exclude: []
      };

      const suggestions = service.generateSuggestions(payload, 8);
      const manyTitles = suggestions.find(s => s.id === 'lint-many-titles');

      expect(manyTitles).toBeTruthy();
      expect(manyTitles?.severity).toBe('info');
    });

    it('should not warn for normal query', () => {
      const payload: QueryPayload = {
        searchType: 'people',
        titles: ['Software Engineer'],
        skills: ['JavaScript', 'React'],
        exclude: ['Junior']
      };

      const suggestions = service.generateSuggestions(payload, 4);
      const lintSuggestions = suggestions.filter(s => s.type === 'lint' || s.type === 'hint');

      expect(lintSuggestions.length).toBe(0);
    });
  });

  describe('synonym suggestions', () => {
    it('should suggest synonyms for known titles', () => {
      const payload: QueryPayload = {
        searchType: 'people',
        titles: ['Frontend Developer'],
        skills: [],
        exclude: []
      };

      const suggestions = service.generateSuggestions(payload, 0);
      const synonymSuggestion = suggestions.find(s => s.type === 'synonym' && s.id.includes('frontend'));

      expect(synonymSuggestion).toBeTruthy();
      expect(synonymSuggestion?.suggestedAdds?.titles).toBeDefined();
      expect(synonymSuggestion?.suggestedAdds?.titles?.length).toBeGreaterThan(0);
    });

    it('should not suggest already present synonyms', () => {
      const payload: QueryPayload = {
        searchType: 'people',
        titles: ['Frontend Developer', 'Front-End Developer', 'UI Developer', 'Frontend Engineer'],
        skills: [],
        exclude: []
      };

      const suggestions = service.generateSuggestions(payload, 3);
      const synonymSuggestions = suggestions.filter(s => s.type === 'synonym');

      // All synonyms are already present, so no new suggestions
      const frontendSuggestion = synonymSuggestions.find(s => s.id.includes('frontend-developer'));
      if (frontendSuggestion) {
        expect(frontendSuggestion.suggestedAdds?.titles?.length).toBe(1); // Only "Front End Developer" left
      }
    });

    it('should suggest synonyms for known skills', () => {
      const payload: QueryPayload = {
        searchType: 'people',
        titles: [],
        skills: ['JavaScript'],
        exclude: []
      };

      const suggestions = service.generateSuggestions(payload, 0);
      const synonymSuggestion = suggestions.find(s => s.type === 'synonym' && s.id.includes('javascript'));

      expect(synonymSuggestion).toBeTruthy();
      expect(synonymSuggestion?.suggestedAdds?.skills).toContain('JS');
    });

    it('should find synonyms when using abbreviation', () => {
      const payload: QueryPayload = {
        searchType: 'people',
        titles: [],
        skills: ['JS'],
        exclude: []
      };

      const suggestions = service.generateSuggestions(payload, 0);
      const synonymSuggestion = suggestions.find(s => s.type === 'synonym');

      expect(synonymSuggestion).toBeTruthy();
      expect(synonymSuggestion?.suggestedAdds?.skills).toContain('JavaScript');
    });

    it('should not suggest synonyms for unknown terms', () => {
      const payload: QueryPayload = {
        searchType: 'people',
        titles: ['Underwater Basket Weaver'],
        skills: ['Obscure Framework'],
        exclude: []
      };

      const suggestions = service.generateSuggestions(payload, 0);
      const synonymSuggestions = suggestions.filter(s => s.type === 'synonym');

      expect(synonymSuggestions.length).toBe(0);
    });
  });

  describe('suggestion properties', () => {
    it('should set isApplied to false by default', () => {
      const payload: QueryPayload = {
        searchType: 'people',
        titles: ['Frontend Developer'],
        skills: [],
        exclude: []
      };

      const suggestions = service.generateSuggestions(payload, 0);

      suggestions.forEach(s => {
        expect(s.isApplied).toBe(false);
      });
    });

    it('should have unique IDs', () => {
      const payload: QueryPayload = {
        searchType: 'people',
        titles: ['Frontend Developer', 'Backend Developer'],
        skills: ['JavaScript', 'TypeScript'],
        exclude: []
      };

      const suggestions = service.generateSuggestions(payload, 4);
      const ids = suggestions.map(s => s.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
