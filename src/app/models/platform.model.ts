import { SearchType } from './search-form.model';

/**
 * Platform-agnostic query payload
 * Contains all search criteria in a normalized format
 */
export interface QueryPayload {
  searchType: SearchType;
  titles: string[];
  skills: string[];
  exclude: string[];
  location?: string;
  filters?: Record<string, unknown>;
}

/**
 * Describes what boolean features a platform supports
 */
export interface PlatformCapabilities {
  supportsBoolean: boolean;
  supportsParentheses: boolean;
  supportsQuotes: boolean;
  supportsNot: boolean;
  maxOperators?: number;
  maxQueryLength?: number;
}

/**
 * Result of validating a query against platform constraints
 */
export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Platform adapter interface
 * Each platform (LinkedIn, Sales Navigator, Recruiter, etc.) implements this
 */
export interface PlatformAdapter {
  readonly id: string;
  readonly label: string;
  readonly supportedSearchTypes: readonly SearchType[];

  getCapabilities(): PlatformCapabilities;
  buildUrl(payload: QueryPayload, booleanQuery: string): string;
  validate(payload: QueryPayload, booleanQuery: string): ValidationResult;
}
