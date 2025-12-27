export type SearchType = 'people' | 'jobs';
export type SearchMode = 'linkedin' | 'salesnav' | 'recruiter';

export interface SearchFormModel {
  searchType: SearchType;
  titles: string[];
  skills: string[];
  exclude: string[];
  location: string;
  mode: SearchMode;
}

export interface BooleanQueryResult {
  query: string;
  warnings: string[];
  operatorCount: number;
}
