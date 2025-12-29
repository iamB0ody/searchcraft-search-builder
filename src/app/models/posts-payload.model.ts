/**
 * Posts Search Payload Model
 * Defines the payload structure for Posts search type (job posts, hiring posts, talent posts)
 */

/**
 * Date range filter for posts search (where platform supports)
 */
export type PostsDateRange = 'any' | '24h' | '7d';

/**
 * Posts search payload structure
 * Contains all criteria specific to posts search
 */
export interface PostsPayload {
  /** Core search terms (e.g., "Angular Developer", "Frontend Engineer") */
  keywords: string[];

  /** Quoted exact phrases that must appear (AND logic) */
  mustIncludePhrases: string[];

  /** Any of these phrases (OR logic) */
  anyOfPhrases: string[];

  /** Phrases to exclude (NOT logic) */
  excludePhrases: string[];

  /** Hashtags for platforms that support them (LinkedIn, X) */
  hashtags?: string[];

  /** Auto-add hiring intent phrases (for job seekers) */
  includeHiringIntent: boolean;

  /** Auto-add open-to-work intent phrases (for recruiters) */
  includeOpenToWorkIntent: boolean;

  /** Auto-add remote work phrases */
  includeRemoteIntent: boolean;

  /** Keyword-based location filter */
  locationText?: string;

  /** Date range filter (where platform supports) */
  dateRange?: PostsDateRange;
}

/**
 * Intent phrases that are auto-injected when toggles are enabled
 */
export const HIRING_INTENT_PHRASES: readonly string[] = [
  'hiring',
  "we're hiring",
  'job opening',
  'vacancy',
  'join our team',
  'now hiring'
] as const;

export const OPEN_TO_WORK_INTENT_PHRASES: readonly string[] = [
  'open to work',
  'open to opportunities',
  'seeking new opportunities',
  'open for opportunities'
] as const;

export const REMOTE_INTENT_PHRASES: readonly string[] = [
  'remote',
  'work from home',
  'distributed',
  'anywhere'
] as const;

/**
 * Create a default/empty PostsPayload
 */
export function createDefaultPostsPayload(): PostsPayload {
  return {
    keywords: [],
    mustIncludePhrases: [],
    anyOfPhrases: [],
    excludePhrases: [],
    hashtags: [],
    includeHiringIntent: false,
    includeOpenToWorkIntent: false,
    includeRemoteIntent: false,
    locationText: '',
    dateRange: 'any'
  };
}
