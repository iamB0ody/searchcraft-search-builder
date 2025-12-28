import { SearchType, SearchMode, BadgeStatus } from './search-form.model';
import { EmotionalSearchMode } from './emotional-mode.model';
import { HiringSignalsState } from '../core/people-signals/hiring-signals.model';

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
  /** Optional emotional search mode for query adjustment */
  emotionalMode?: EmotionalSearchMode;
  /** Optional hiring signals state for People search */
  hiringSignals?: HiringSignalsState;
  /** Signal include phrases injected by applyHiringSignals (internal use) */
  signalIncludes?: string[];
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
 * Indeed regional domains (63 countries)
 */
export type IndeedRegion =
  // Americas
  | 'ar' | 'br' | 'ca' | 'cl' | 'co' | 'com' | 'ec' | 'mx' | 'pe' | 've'
  // Europe
  | 'at' | 'be' | 'ch' | 'co.uk' | 'cz' | 'de' | 'dk' | 'es' | 'fi' | 'fr'
  | 'gr' | 'hu' | 'ie' | 'it' | 'lu' | 'nl' | 'no' | 'pl' | 'pt' | 'ro'
  | 'ru' | 'se' | 'sk' | 'tr' | 'ua'
  // Asia-Pacific
  | 'au' | 'bd' | 'cn' | 'hk' | 'id' | 'in' | 'jp' | 'kr' | 'my' | 'nz'
  | 'pk' | 'ph' | 'sg' | 'th' | 'tw' | 'vn'
  // Middle East & Africa
  | 'ae' | 'bh' | 'eg' | 'il' | 'ke' | 'kw' | 'ma' | 'ng' | 'om' | 'qa' | 'sa' | 'za';

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
 * Boolean support level for a platform
 * - 'good': Full boolean support (AND, OR, NOT, parentheses)
 * - 'partial': Limited boolean support (some operators work)
 * - 'none': Keywords only (no boolean operators)
 */
export type BooleanLevel = 'good' | 'partial' | 'none';

/**
 * Platform region for UI grouping
 */
export type PlatformRegion = 'global' | 'mena';

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

  // Boolean level indicator for UI hints
  booleanLevel: BooleanLevel;

  // Granular operator support
  supportsOR: boolean;
  supportsAND: boolean;
  supportsMinusExclude: boolean;

  // Platform region for UI grouping
  region: PlatformRegion;
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

/**
 * Typed platform identifiers for type-safe platform references
 */
export type PlatformId =
  // Global platforms
  | 'linkedin'
  | 'salesnav'
  | 'google-jobs'
  | 'indeed'
  // MENA platforms
  | 'bayt'
  | 'gulftalent'
  | 'naukrigulf'
  | 'recruitnet'
  | 'bebee'
  | 'gulfjobs'
  | 'arabjobs';

/**
 * Array of all platform IDs for iteration
 */
export const ALL_PLATFORM_IDS: readonly PlatformId[] = [
  'linkedin',
  'salesnav',
  'google-jobs',
  'indeed',
  'bayt',
  'gulftalent',
  'naukrigulf',
  'recruitnet',
  'bebee',
  'gulfjobs',
  'arabjobs'
] as const;
