import { QueryPayload } from '../../models/platform.model';

/**
 * Query simplification utilities for platforms with limited Boolean support.
 * These utilities help convert complex Boolean queries into simpler keyword-based queries.
 */

/**
 * Normalize a search term: trim whitespace and collapse multiple spaces
 */
export function normalizeTerm(term: string): string {
  return term.trim().replace(/\s+/g, ' ');
}

/**
 * Wrap multi-word phrases in quotes for exact match
 */
export function quoteIfNeeded(term: string): string {
  const normalized = normalizeTerm(term);
  if (!normalized) return '';
  // Quote if contains space and not already quoted
  if (normalized.includes(' ') && !normalized.startsWith('"')) {
    return `"${normalized}"`;
  }
  return normalized;
}

/**
 * Format exclusion term with minus prefix (-term or -"multi word")
 */
export function formatExclude(term: string): string {
  const quoted = quoteIfNeeded(term);
  if (!quoted) return '';
  return `-${quoted}`;
}

/**
 * Flatten payload to simple space-separated keywords (no Boolean operators).
 * Used for platforms with booleanLevel='none'.
 */
export function flattenToKeywords(payload: QueryPayload): string {
  const parts: string[] = [];

  // Add titles as individual keywords (quoted if multi-word)
  payload.titles.forEach(title => {
    const quoted = quoteIfNeeded(title);
    if (quoted) parts.push(quoted);
  });

  // Add skills as individual keywords (quoted if multi-word)
  payload.skills.forEach(skill => {
    const quoted = quoteIfNeeded(skill);
    if (quoted) parts.push(quoted);
  });

  // Add excludes with minus prefix
  payload.exclude.forEach(ex => {
    const formatted = formatExclude(ex);
    if (formatted) parts.push(formatted);
  });

  // Add location if present
  if (payload.location?.trim()) {
    parts.push(quoteIfNeeded(payload.location));
  }

  return parts.join(' ');
}

/**
 * Simplify boolean query: keep OR for titles, flatten skills, use minus for excludes.
 * Used for platforms with booleanLevel='partial'.
 */
export function simplifyBoolean(payload: QueryPayload): string {
  const parts: string[] = [];

  // Titles: OR-joined group (most platforms handle OR reasonably well)
  if (payload.titles.length > 0) {
    const titleTerms = payload.titles
      .map(t => quoteIfNeeded(t))
      .filter(t => t);
    if (titleTerms.length > 1) {
      parts.push(`(${titleTerms.join(' OR ')})`);
    } else if (titleTerms.length === 1) {
      parts.push(titleTerms[0]);
    }
  }

  // Skills: space-separated (no operators - simpler for partial boolean)
  payload.skills.forEach(skill => {
    const quoted = quoteIfNeeded(skill);
    if (quoted) parts.push(quoted);
  });

  // Location if present
  if (payload.location?.trim()) {
    parts.push(quoteIfNeeded(payload.location));
  }

  // Build main query
  let query = parts.join(' ');

  // Excludes: minus prefix
  if (payload.exclude.length > 0) {
    const excludeTerms = payload.exclude
      .map(ex => formatExclude(ex))
      .filter(ex => ex);
    if (excludeTerms.length > 0) {
      query = query ? `${query} ${excludeTerms.join(' ')}` : excludeTerms.join(' ');
    }
  }

  return query.trim();
}

/**
 * Slugify a keyword for URL path-based searches (e.g., /software-engineer-jobs)
 */
export function slugifyKeyword(keyword: string): string {
  return normalizeTerm(keyword)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .replace(/^-|-$/g, '');        // Trim leading/trailing hyphens
}

/**
 * Extract primary keyword from payload for slug-based URLs
 * Prefers first title, falls back to first skill
 */
export function getPrimaryKeyword(payload: QueryPayload): string {
  if (payload.titles.length > 0) {
    return payload.titles[0];
  }
  if (payload.skills.length > 0) {
    return payload.skills[0];
  }
  return '';
}

/**
 * Count operators in a query string (for complexity assessment)
 */
export function countSimplifiedOperators(query: string): number {
  if (!query) return 0;
  const orCount = (query.match(/\bOR\b/gi) || []).length;
  const minusCount = (query.match(/-(?=\S)/g) || []).length;
  return orCount + minusCount;
}
