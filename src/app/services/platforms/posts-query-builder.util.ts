import { PostsPayload, HIRING_INTENT_PHRASES, OPEN_TO_WORK_INTENT_PHRASES, REMOTE_INTENT_PHRASES } from '../../models/posts-payload.model';
import { BadgeStatus } from '../../models/search-form.model';
import { deduplicateCaseInsensitive, formatValue, countOperators, normalizeQuery, detectUnsupportedChars } from './query-builder.util';

/**
 * Options for building posts-specific queries
 */
export interface PostsQueryBuildOptions {
  /** Use 'NOT' for LinkedIn-style or '-' for Google/X-style exclusions */
  notOperator: 'NOT' | '-';
  /** Whether to wrap groups in parentheses */
  wrapGroups: boolean;
  /** Use uppercase AND/OR/NOT operators */
  uppercaseOperators: boolean;
  /** Whether platform supports hashtags (e.g., LinkedIn Posts, X) */
  supportsHashtags?: boolean;
  /** Maximum query length before warning */
  queryLengthWarning?: number;
  /** Operator count warning threshold */
  operatorWarningThreshold?: number;
}

/**
 * Result of building a posts query
 */
export interface PostsQueryBuildResult {
  /** The generated boolean query string */
  query: string;
  /** Count of boolean operators in the query */
  operatorCount: number;
  /** Any warnings generated during query building */
  warnings: string[];
  /** Badge status for UI display */
  badgeStatus: BadgeStatus;
  /** Phrases that were auto-injected due to intent toggles */
  injectedPhrases: string[];
}

/**
 * Get hiring intent phrases for auto-injection
 */
export function getHiringIntentPhrases(): string[] {
  return [...HIRING_INTENT_PHRASES];
}

/**
 * Get open-to-work intent phrases for auto-injection
 */
export function getOpenToWorkPhrases(): string[] {
  return [...OPEN_TO_WORK_INTENT_PHRASES];
}

/**
 * Get remote intent phrases for auto-injection
 */
export function getRemoteIntentPhrases(): string[] {
  return [...REMOTE_INTENT_PHRASES];
}

/**
 * Build a posts search query from PostsPayload
 */
export function buildPostsQuery(
  payload: PostsPayload,
  options: PostsQueryBuildOptions
): PostsQueryBuildResult {
  const warnings: string[] = [];
  const injectedPhrases: string[] = [];
  let operatorCount = 0;

  // Collect all phrases to include
  const allAnyOfPhrases: string[] = [];

  // Deduplicate inputs
  const keywords = deduplicateCaseInsensitive(payload.keywords);
  const mustInclude = deduplicateCaseInsensitive(payload.mustIncludePhrases);
  const anyOf = deduplicateCaseInsensitive(payload.anyOfPhrases);
  const excludes = deduplicateCaseInsensitive(payload.excludePhrases);
  const hashtags = payload.hashtags ? deduplicateCaseInsensitive(payload.hashtags) : [];

  // Add user's anyOf phrases
  allAnyOfPhrases.push(...anyOf);

  // Add hiring intent phrases if enabled
  if (payload.includeHiringIntent) {
    const hiringPhrases = getHiringIntentPhrases();
    allAnyOfPhrases.push(...hiringPhrases);
    injectedPhrases.push(...hiringPhrases);
  }

  // Add open-to-work intent phrases if enabled
  if (payload.includeOpenToWorkIntent) {
    const openToWorkPhrases = getOpenToWorkPhrases();
    allAnyOfPhrases.push(...openToWorkPhrases);
    injectedPhrases.push(...openToWorkPhrases);
  }

  // Add remote intent phrases if enabled
  if (payload.includeRemoteIntent) {
    const remotePhrases = getRemoteIntentPhrases();
    allAnyOfPhrases.push(...remotePhrases);
    injectedPhrases.push(...remotePhrases);
  }

  // Deduplicate the combined anyOf phrases
  const dedupedAnyOf = deduplicateCaseInsensitive(allAnyOfPhrases);

  // Check for unsupported characters in all inputs
  [...keywords, ...mustInclude, ...dedupedAnyOf, ...excludes].forEach(value => {
    const unsupported = detectUnsupportedChars(value);
    if (unsupported.length > 0) {
      warnings.push(`Unsupported characters detected in "${value}". Search engine may ignore them.`);
    }
  });

  // Build keywords clause (main search terms, OR joined)
  let keywordsClause = '';
  if (keywords.length > 0) {
    const formatted = keywords.map(k => formatValue(k));
    keywordsClause = options.wrapGroups && formatted.length > 1
      ? `(${formatted.join(' OR ')})`
      : formatted.join(' OR ');
  }

  // Build must-include clause (AND joined, quoted phrases)
  let mustIncludeClause = '';
  if (mustInclude.length > 0) {
    // Must-include phrases are always quoted
    const formatted = mustInclude.map(p => `"${p.replace(/"/g, '')}"`);
    mustIncludeClause = formatted.join(' AND ');
  }

  // Build anyOf clause (OR joined - includes intent phrases)
  let anyOfClause = '';
  if (dedupedAnyOf.length > 0) {
    const formatted = dedupedAnyOf.map(p => formatValue(p));
    anyOfClause = options.wrapGroups && formatted.length > 1
      ? `(${formatted.join(' OR ')})`
      : formatted.join(' OR ');
  }

  // Build hashtags clause (for platforms that support it)
  let hashtagsClause = '';
  if (options.supportsHashtags && hashtags.length > 0) {
    // Format hashtags with # prefix if not already present
    const formatted = hashtags.map(h => h.startsWith('#') ? h : `#${h}`);
    hashtagsClause = formatted.join(' ');
  }

  // Build location clause (as keyword injection)
  let locationClause = '';
  if (payload.locationText?.trim()) {
    const location = payload.locationText.trim();
    locationClause = location.includes(' ') ? `"${location}"` : location;
  }

  // Build exclude clause (NOT or - prefix)
  let excludeClause = '';
  if (excludes.length > 0) {
    if (options.notOperator === '-') {
      excludeClause = excludes.map(e => `-${formatValue(e)}`).join(' ');
    } else {
      excludeClause = excludes.map(e => `NOT ${formatValue(e)}`).join(' ');
    }
  }

  // Count operators in each clause
  operatorCount += countOperators(keywordsClause);
  operatorCount += countOperators(mustIncludeClause);
  operatorCount += countOperators(anyOfClause);
  operatorCount += countOperators(excludeClause);

  // Combine clauses with AND
  const parts: string[] = [];
  if (keywordsClause) parts.push(keywordsClause);
  if (mustIncludeClause) parts.push(mustIncludeClause);
  if (anyOfClause) parts.push(anyOfClause);
  if (locationClause) parts.push(locationClause);
  if (hashtagsClause) parts.push(hashtagsClause);

  let query = parts.join(' AND ');

  // Add excludes at the end
  if (excludeClause) {
    query = query ? `${query} ${excludeClause}` : excludeClause;
  }

  // Add AND count between main parts
  if (parts.length > 1) {
    operatorCount += parts.length - 1;
  }

  const normalizedQuery = normalizeQuery(query);

  // Add warnings based on thresholds
  if (options.operatorWarningThreshold && operatorCount >= options.operatorWarningThreshold) {
    warnings.push(`Query has ${operatorCount} operators. Consider simplifying for better results.`);
  }

  if (options.queryLengthWarning && normalizedQuery.length >= options.queryLengthWarning) {
    warnings.push(`Query length (${normalizedQuery.length} chars) may be too long for this platform.`);
  }

  // Determine badge status
  let badgeStatus: BadgeStatus = 'safe';
  if (options.operatorWarningThreshold && operatorCount >= options.operatorWarningThreshold) {
    badgeStatus = 'warning';
  } else if (options.queryLengthWarning && normalizedQuery.length >= options.queryLengthWarning) {
    badgeStatus = 'warning';
  }

  return {
    query: normalizedQuery,
    operatorCount,
    warnings,
    badgeStatus,
    injectedPhrases: deduplicateCaseInsensitive(injectedPhrases)
  };
}

/**
 * Build a simplified query for platforms with limited boolean support
 * (keywords only, no complex operators)
 */
export function buildSimplifiedPostsQuery(
  payload: PostsPayload,
  options: { supportsHashtags?: boolean }
): PostsQueryBuildResult {
  const injectedPhrases: string[] = [];

  // Collect all terms
  const terms: string[] = [];

  // Add keywords
  const keywords = deduplicateCaseInsensitive(payload.keywords);
  terms.push(...keywords.map(k => formatValue(k)));

  // Add must-include as quoted phrases
  const mustInclude = deduplicateCaseInsensitive(payload.mustIncludePhrases);
  terms.push(...mustInclude.map(p => `"${p.replace(/"/g, '')}"`));

  // Add any-of phrases
  const anyOf = deduplicateCaseInsensitive(payload.anyOfPhrases);
  terms.push(...anyOf.map(p => formatValue(p)));

  // Add intent phrases (pick one representative from each group when enabled)
  if (payload.includeHiringIntent) {
    const phrase = 'hiring';
    terms.push(phrase);
    injectedPhrases.push(phrase);
  }

  if (payload.includeOpenToWorkIntent) {
    const phrase = '"open to work"';
    terms.push(phrase);
    injectedPhrases.push('open to work');
  }

  if (payload.includeRemoteIntent) {
    const phrase = 'remote';
    terms.push(phrase);
    injectedPhrases.push(phrase);
  }

  // Add location
  if (payload.locationText?.trim()) {
    const location = payload.locationText.trim();
    terms.push(location.includes(' ') ? `"${location}"` : location);
  }

  // Add hashtags if supported
  if (options.supportsHashtags && payload.hashtags && payload.hashtags.length > 0) {
    const hashtags = deduplicateCaseInsensitive(payload.hashtags);
    terms.push(...hashtags.map(h => h.startsWith('#') ? h : `#${h}`));
  }

  // Add excludes with minus prefix
  const excludes = deduplicateCaseInsensitive(payload.excludePhrases);
  terms.push(...excludes.map(e => `-${formatValue(e)}`));

  const query = terms.join(' ');

  return {
    query: normalizeQuery(query),
    operatorCount: 0,
    warnings: [],
    badgeStatus: 'safe',
    injectedPhrases: deduplicateCaseInsensitive(injectedPhrases)
  };
}
