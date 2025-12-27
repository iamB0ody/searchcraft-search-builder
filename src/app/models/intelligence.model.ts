/**
 * Types of suggestions the intelligence engine can provide
 */
export type SuggestionType = 'lint' | 'synonym' | 'template' | 'hint';

/**
 * Severity level of a suggestion
 */
export type SuggestionSeverity = 'info' | 'warning';

/**
 * Changes that a suggestion can apply to the search form
 */
export interface SuggestedChanges {
  titles?: string[];
  skills?: string[];
  exclude?: string[];
}

/**
 * A single suggestion from the intelligence engine
 */
export interface IntelligenceSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  severity: SuggestionSeverity;
  suggestedAdds?: SuggestedChanges;
  suggestedRemoves?: SuggestedChanges;
  isApplied: boolean;
}

/**
 * Entry in the synonym dictionary
 */
export interface SynonymEntry {
  term: string;
  synonyms: string[];
  category: 'role' | 'skill' | 'technology';
}
