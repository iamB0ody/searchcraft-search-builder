import { SearchType, SearchMode, BadgeStatus } from './search-form.model';

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
 * Result of platform-specific query building
 */
export interface PlatformQueryResult {
  query: string;
  operatorCount: number;
  warnings: string[];
  badgeStatus: BadgeStatus;
}

/**
 * Indeed regional domains
 */
export type IndeedRegion = 'com' | 'co.uk' | 'de' | 'fr' | 'ca' | 'in' | 'au';

/**
 * Shareable builder state for URL encoding
 * Contains minimal state needed to recreate a search
 */
export interface BuilderShareState {
  schemaVersion: number;
  payload: QueryPayload;
  platformId: string;
  mode: SearchMode;
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
 * Each platform (LinkedIn, Sales Navigator, Google, Indeed, etc.) implements this
 */
export interface PlatformAdapter {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly notes: readonly string[];
  readonly icon: string;
  readonly supportedSearchTypes: readonly SearchType[];

  getCapabilities(): PlatformCapabilities;
  buildQuery(payload: QueryPayload): PlatformQueryResult;
  buildUrl(payload: QueryPayload, booleanQuery: string): string;
  validate(payload: QueryPayload, booleanQuery: string): ValidationResult;
}
