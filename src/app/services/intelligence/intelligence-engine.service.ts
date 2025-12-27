import { Injectable } from '@angular/core';
import { QueryPayload } from '../../models/platform.model';
import { IntelligenceSuggestion, SynonymEntry } from '../../models/intelligence.model';
import { SYNONYMS_DATA } from '../../data/synonyms';

@Injectable({ providedIn: 'root' })
export class IntelligenceEngineService {
  private synonymDictionary: SynonymEntry[] = [];

  constructor() {
    this.loadDictionary();
  }

  /**
   * Generate suggestions based on the current search payload
   * Suggestions are never auto-applied - user must opt in
   */
  generateSuggestions(payload: QueryPayload, operatorCount: number): IntelligenceSuggestion[] {
    const suggestions: IntelligenceSuggestion[] = [];

    // Lint rules (quality checks)
    suggestions.push(...this.getLintSuggestions(payload, operatorCount));

    // Synonym suggestions (related terms)
    suggestions.push(...this.getSynonymSuggestions(payload));

    return suggestions;
  }

  private getLintSuggestions(payload: QueryPayload, operatorCount: number): IntelligenceSuggestion[] {
    const suggestions: IntelligenceSuggestion[] = [];

    // Empty query hint
    if (payload.titles.length === 0 && payload.skills.length === 0) {
      suggestions.push({
        id: 'lint-empty',
        type: 'hint',
        title: 'Empty search',
        description: 'Add job titles or skills to start building your search.',
        severity: 'info',
        isApplied: false
      });
    }

    // Only excludes warning
    if (payload.titles.length === 0 && payload.skills.length === 0 && payload.exclude.length > 0) {
      suggestions.push({
        id: 'lint-only-excludes',
        type: 'lint',
        title: 'Only exclusions',
        description: 'Your search only has exclusion terms. Add some titles or skills for better results.',
        severity: 'warning',
        isApplied: false
      });
    }

    // Too restrictive (many AND conditions)
    if (payload.skills.length > 5) {
      suggestions.push({
        id: 'lint-too-restrictive',
        type: 'lint',
        title: 'Query may be too restrictive',
        description: `Using ${payload.skills.length} AND conditions may significantly limit results.`,
        severity: 'warning',
        isApplied: false
      });
    }

    // Many OR conditions
    if (payload.titles.length > 8) {
      suggestions.push({
        id: 'lint-many-titles',
        type: 'lint',
        title: 'Many title variations',
        description: `You have ${payload.titles.length} title variations. Consider if all are needed.`,
        severity: 'info',
        isApplied: false
      });
    }

    return suggestions;
  }

  private getSynonymSuggestions(payload: QueryPayload): IntelligenceSuggestion[] {
    const suggestions: IntelligenceSuggestion[] = [];

    // Check titles for synonym suggestions
    for (const title of payload.titles) {
      const entry = this.findSynonymEntry(title);
      if (entry) {
        const newSynonyms = this.getUnusedSynonyms(entry, title, payload.titles);
        if (newSynonyms.length > 0) {
          suggestions.push({
            id: `synonym-title-${title.toLowerCase().replace(/\s+/g, '-')}`,
            type: 'synonym',
            title: `Related titles for "${title}"`,
            description: `Consider adding: ${newSynonyms.join(', ')}`,
            severity: 'info',
            suggestedAdds: { titles: newSynonyms },
            isApplied: false
          });
        }
      }
    }

    // Check skills for synonym suggestions
    for (const skill of payload.skills) {
      const entry = this.findSynonymEntry(skill);
      if (entry) {
        const newSynonyms = this.getUnusedSynonyms(entry, skill, payload.skills);
        if (newSynonyms.length > 0) {
          suggestions.push({
            id: `synonym-skill-${skill.toLowerCase().replace(/\s+/g, '-')}`,
            type: 'synonym',
            title: `Related terms for "${skill}"`,
            description: `Consider adding: ${newSynonyms.join(', ')}`,
            severity: 'info',
            suggestedAdds: { skills: newSynonyms },
            isApplied: false
          });
        }
      }
    }

    return suggestions;
  }

  private findSynonymEntry(term: string): SynonymEntry | undefined {
    const lower = term.toLowerCase();
    return this.synonymDictionary.find(
      e => e.term.toLowerCase() === lower ||
           e.synonyms.some(s => s.toLowerCase() === lower)
    );
  }

  private getUnusedSynonyms(entry: SynonymEntry, currentTerm: string, existingTerms: string[]): string[] {
    const lower = currentTerm.toLowerCase();
    const existingLower = existingTerms.map(t => t.toLowerCase());

    // Collect all possible terms (the main term + all synonyms)
    const allTerms = [entry.term, ...entry.synonyms];

    // Filter to only unused ones
    return allTerms.filter(t => {
      const termLower = t.toLowerCase();
      return termLower !== lower && !existingLower.includes(termLower);
    });
  }

  private loadDictionary(): void {
    this.synonymDictionary = SYNONYMS_DATA;
  }
}
