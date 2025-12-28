import { QueryPayload } from '../../models/platform.model';
import { BadgeStatus } from '../../models/search-form.model';

/**
 * Options for building platform-specific boolean queries
 */
export interface QueryBuildOptions {
  /** Use 'NOT' for LinkedIn-style or '-' for Google/Indeed-style exclusions */
  notOperator: 'NOT' | '-';
  /** Optional prefix like 'site:linkedin.com/in' for Google X-ray searches */
  sitePrefix?: string;
  /** Whether to wrap groups in parentheses (most platforms support this) */
  wrapGroups: boolean;
  /** Use uppercase AND/OR/NOT operators */
  uppercaseOperators: boolean;
  /** Maximum operators before warning (undefined = no limit) */
  operatorWarningThreshold?: number;
  /** Maximum operators before error (undefined = no limit) */
  operatorLimit?: number;
  /** Maximum query length before warning */
  queryLengthWarning?: number;
}

/**
 * Result of building a boolean query
 */
export interface QueryBuildResult {
  query: string;
  operatorCount: number;
  warnings: string[];
  badgeStatus: BadgeStatus;
}

const UNSUPPORTED_CHARS = ['*', '{', '}', '[', ']', '<', '>'];

/**
 * Deduplicate array items case-insensitively, preserving original casing
 */
export function deduplicateCaseInsensitive(items: string[]): string[] {
  const seen = new Map<string, string>();
  for (const item of items) {
    const trimmed = item.trim();
    if (trimmed) {
      const lower = trimmed.toLowerCase();
      if (!seen.has(lower)) {
        seen.set(lower, trimmed);
      }
    }
  }
  return Array.from(seen.values());
}

/**
 * Format a value for boolean query (quote if contains spaces or special chars)
 */
export function formatValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.includes(' ') || /[,()]/.test(trimmed)) {
    return `"${trimmed}"`;
  }
  return trimmed;
}

/**
 * Detect unsupported characters in a value
 */
export function detectUnsupportedChars(value: string): string[] {
  return UNSUPPORTED_CHARS.filter(char => value.includes(char));
}

/**
 * Count boolean operators in a clause
 */
export function countOperators(clause: string): number {
  if (!clause) return 0;
  const andCount = (clause.match(/\bAND\b/gi) || []).length;
  const orCount = (clause.match(/\bOR\b/gi) || []).length;
  const notCount = (clause.match(/\bNOT\b/gi) || []).length;
  const minusCount = (clause.match(/(?:^|\s)-(?=\S)/g) || []).length;
  return andCount + orCount + notCount + minusCount;
}

/**
 * Normalize query by collapsing whitespace and removing leading/trailing AND
 */
export function normalizeQuery(query: string): string {
  return query
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^\s*AND\s+/, '')
    .replace(/\s+AND\s*$/, '');
}

/**
 * Build a platform-specific boolean query from payload
 */
export function buildBooleanQuery(
  payload: QueryPayload,
  options: QueryBuildOptions
): QueryBuildResult {
  const warnings: string[] = [];
  let operatorCount = 0;

  // Deduplicate inputs
  const titles = deduplicateCaseInsensitive(payload.titles);
  const skills = deduplicateCaseInsensitive(payload.skills);
  const excludes = deduplicateCaseInsensitive(payload.exclude);

  // Check for unsupported characters
  [...titles, ...skills, ...excludes].forEach(value => {
    const unsupported = detectUnsupportedChars(value);
    if (unsupported.length > 0) {
      warnings.push(`Unsupported characters detected in "${value}". Search engine may ignore them.`);
    }
  });

  // Build title clause (OR joined)
  let titlesClause = '';
  if (titles.length > 0) {
    const formatted = titles.map(t => formatValue(t));
    titlesClause = options.wrapGroups
      ? `(${formatted.join(' OR ')})`
      : formatted.join(' OR ');
  }

  // Build skills clause (AND joined)
  let skillsClause = '';
  if (skills.length > 0) {
    const formatted = skills.map(s => formatValue(s));
    skillsClause = options.wrapGroups
      ? `(${formatted.join(' AND ')})`
      : formatted.join(' AND ');
  }

  // Build signal includes clause (OR joined, from hiring signals)
  // These are phrases like "open to work" OR "seeking opportunities"
  let signalIncludesClause = '';
  if (payload.signalIncludes && payload.signalIncludes.length > 0) {
    // Signal phrases are already quoted in the catalog, join with OR
    signalIncludesClause = options.wrapGroups
      ? `(${payload.signalIncludes.join(' OR ')})`
      : payload.signalIncludes.join(' OR ');
  }

  // Build people location clause (keyword injection for People search)
  let peopleLocationClause = '';
  if (payload.searchType === 'people' && payload.peopleLocation?.value?.trim()) {
    const location = payload.peopleLocation.value.trim();
    // Quote multi-word locations
    peopleLocationClause = location.includes(' ') ? `"${location}"` : location;
  }

  // Build exclude clause (NOT or - prefix)
  let excludeClause = '';
  if (excludes.length > 0) {
    if (options.notOperator === '-') {
      // Google/Indeed style: -term
      excludeClause = excludes.map(e => `-${formatValue(e)}`).join(' ');
    } else {
      // LinkedIn style: NOT term
      excludeClause = excludes.map(e => `NOT ${formatValue(e)}`).join(' ');
    }
  }

  // Count operators in each clause
  operatorCount += countOperators(titlesClause);
  operatorCount += countOperators(skillsClause);
  operatorCount += countOperators(signalIncludesClause);
  operatorCount += countOperators(excludeClause);

  // Combine clauses
  const parts: string[] = [];
  if (titlesClause) parts.push(titlesClause);
  if (skillsClause) parts.push(skillsClause);
  if (signalIncludesClause) parts.push(signalIncludesClause);
  if (peopleLocationClause) parts.push(peopleLocationClause);

  let query = parts.join(' AND ');
  if (excludeClause) {
    query = query ? `${query} ${excludeClause}` : excludeClause;
  }

  // Add AND count between main parts
  if (parts.length > 1) {
    operatorCount += parts.length - 1;
  }

  // Add site prefix if specified
  if (options.sitePrefix && query) {
    query = `${options.sitePrefix} ${query}`;
  }

  const normalizedQuery = normalizeQuery(query);

  // Add warnings based on thresholds
  if (options.operatorLimit && operatorCount > options.operatorLimit) {
    warnings.push(`Query exceeds ${options.operatorLimit} operator limit. Please simplify.`);
  } else if (options.operatorWarningThreshold && operatorCount >= options.operatorWarningThreshold) {
    warnings.push(`Query has ${operatorCount} operators. Consider simplifying.`);
  }

  if (options.queryLengthWarning && normalizedQuery.length >= options.queryLengthWarning) {
    warnings.push(`Query length (${normalizedQuery.length} chars) may be too long.`);
  }

  // Determine badge status
  let badgeStatus: BadgeStatus = 'safe';
  if (options.operatorLimit && operatorCount > options.operatorLimit) {
    badgeStatus = 'danger';
  } else if (options.operatorWarningThreshold && operatorCount >= options.operatorWarningThreshold) {
    badgeStatus = 'warning';
  } else if (options.queryLengthWarning && normalizedQuery.length >= options.queryLengthWarning) {
    badgeStatus = 'warning';
  }

  return {
    query: normalizedQuery,
    operatorCount,
    warnings,
    badgeStatus
  };
}
