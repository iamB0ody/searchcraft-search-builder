export type SearchType = 'people' | 'jobs';
export type SearchMode = 'linkedin' | 'salesnav' | 'recruiter';

// Job filter types
export type DatePosted = 'any' | 'day' | 'week' | 'month';
export type ExperienceLevel = 'internship' | 'entry' | 'associate' | 'mid-senior' | 'director' | 'executive';
export type WorkType = 'onsite' | 'remote' | 'hybrid';

export interface SearchFormModel {
  searchType: SearchType;
  titles: string[];
  skills: string[];
  exclude: string[];
  location: string;
  mode: SearchMode;
  // Job filters (only used when searchType is 'jobs')
  datePosted: DatePosted;
  experienceLevels: ExperienceLevel[];
  workTypes: WorkType[];
  easyApply: boolean;
}

export interface BooleanQueryResult {
  query: string;
  warnings: string[];
  operatorCount: number;
}
