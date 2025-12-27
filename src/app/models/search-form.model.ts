export type SearchType = 'people' | 'jobs';
export type SearchMode = 'linkedin' | 'salesnav' | 'recruiter';

// Job filter types
export type DatePosted = 'any' | 'day' | 'week' | 'month';
export type ExperienceLevel = 'internship' | 'entry' | 'associate' | 'mid-senior' | 'director' | 'executive';
export type WorkType = 'onsite' | 'remote' | 'hybrid';
export type SortBy = 'relevant' | 'recent';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship' | 'other';

// People filter types
export type ConnectionLevel = '1st' | '2nd' | '3rd+';
export type ProfileLanguage = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ar' | 'zh' | 'ja' | 'ko' | 'it' | 'nl' | 'ru';

export interface SearchFormModel {
  searchType: SearchType;
  titles: string[];
  skills: string[];
  exclude: string[];
  location: string;
  mode: SearchMode;
  // Job filters (only used when searchType is 'jobs')
  sortBy: SortBy;
  datePosted: DatePosted;
  jobTypes: JobType[];
  experienceLevels: ExperienceLevel[];
  workTypes: WorkType[];
  easyApply: boolean;
  hasVerifications: boolean;
  underTenApplicants: boolean;
  // People filters (only used when searchType is 'people')
  connectionLevels: ConnectionLevel[];
  profileLanguages: ProfileLanguage[];
  firstName: string;
  lastName: string;
  keywordTitle: string;
  keywordCompany: string;
  keywordSchool: string;
}

export interface BooleanQueryResult {
  query: string;
  warnings: string[];
  operatorCount: number;
}
