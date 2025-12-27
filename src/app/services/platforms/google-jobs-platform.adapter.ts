import { Injectable, signal } from '@angular/core';
import {
  PlatformAdapter,
  PlatformCapabilities,
  PlatformQueryResult,
  QueryPayload,
  ValidationResult
} from '../../models/platform.model';
import {
  countOperators,
  deduplicateCaseInsensitive,
  detectUnsupportedChars,
  formatValue,
  normalizeQuery
} from './query-builder.util';

@Injectable({ providedIn: 'root' })
export class GoogleJobsPlatformAdapter implements PlatformAdapter {
  readonly id = 'google-jobs';
  readonly label = 'Google Jobs';
  readonly description = 'Google Jobs search experience';
  readonly notes = [
    'Google Jobs works best with shorter, simpler queries',
    'Uses minus (-) for exclusions',
    'Boolean operators may be interpreted differently than LinkedIn'
  ] as const;
  readonly icon = 'logo-google';
  readonly supportedSearchTypes = ['jobs'] as const;

  private readonly BASE_URL = 'https://www.google.com/search';
  private readonly MAX_QUERY_LENGTH = 2048;
  private readonly COMPLEXITY_WARNING_THRESHOLD = 10;

  /**
   * UI toggle: Include location keyword in query
   * Default: true (enabled)
   */
  readonly includeLocationKeyword = signal(true);

  /**
   * UI toggle: Skills joiner (OR for broader, AND for specific)
   * Default: 'OR'
   */
  readonly skillsJoiner = signal<'OR' | 'AND'>('OR');

  getCapabilities(): PlatformCapabilities {
    return {
      supportsBoolean: true,
      supportsParentheses: true,
      supportsQuotes: true,
      supportsNot: false, // Google uses - instead of NOT
      maxOperators: undefined,
      maxQueryLength: this.MAX_QUERY_LENGTH
    };
  }

  buildQuery(payload: QueryPayload): PlatformQueryResult {
    const warnings: string[] = [];

    // Always add Google Jobs guidance
    warnings.push('Google Jobs may interpret Boolean differently than LinkedIn; keep queries simple.');

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

    // Build query parts
    const parts: string[] = [];

    // Titles (OR-joined, quoted if multi-word)
    if (titles.length > 0) {
      const titleGroup = titles.map(t => formatValue(t)).join(' OR ');
      parts.push(`(${titleGroup})`);
    }

    // Skills (joiner based on toggle: OR or AND)
    if (skills.length > 0) {
      const joiner = this.skillsJoiner();
      const skillGroup = skills.map(s => formatValue(s)).join(` ${joiner} `);
      parts.push(joiner === 'OR' ? `(${skillGroup})` : skillGroup);
    }

    // Location (if toggle enabled and location provided)
    if (this.includeLocationKeyword() && payload.location?.trim()) {
      parts.push(formatValue(payload.location.trim()));
    }

    // Build main query with AND between groups
    let query = parts.join(' AND ');

    // Exclusions (minus prefix)
    if (excludes.length > 0) {
      const excludeTerms = excludes.map(e => `-${formatValue(e)}`).join(' ');
      query = query ? `${query} ${excludeTerms}` : excludeTerms;
    }

    const normalizedQuery = normalizeQuery(query);
    const operatorCount = countOperators(normalizedQuery);

    // Complexity warnings
    if (operatorCount > this.COMPLEXITY_WARNING_THRESHOLD) {
      warnings.push('Google Jobs works best with shorter queries—consider reducing terms.');
    }

    if (normalizedQuery.length > 150) {
      warnings.push('Consider shortening your query for better Google Jobs results.');
    }

    // Count ANDs - Google Jobs works better with OR
    const andCount = (normalizedQuery.match(/\bAND\b/g) || []).length;
    if (andCount > 3) {
      warnings.push('Consider using OR instead of AND for broader results.');
    }

    // Determine badge status
    let badgeStatus: 'safe' | 'warning' | 'danger' = 'safe';
    if (operatorCount > 15 || normalizedQuery.length > this.MAX_QUERY_LENGTH) {
      badgeStatus = 'danger';
    } else if (operatorCount > this.COMPLEXITY_WARNING_THRESHOLD || normalizedQuery.length > 150) {
      badgeStatus = 'warning';
    }

    return {
      query: normalizedQuery,
      operatorCount,
      warnings,
      badgeStatus
    };
  }

  buildUrl(payload: QueryPayload, booleanQuery: string): string {
    if (!booleanQuery) return '';

    const params = new URLSearchParams();
    params.set('q', booleanQuery);

    // Append ibp=htl;jobs for Google Jobs experience
    return `${this.BASE_URL}?${params.toString()}&ibp=htl;jobs`;
  }

  validate(payload: QueryPayload, booleanQuery: string): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (booleanQuery.length > this.MAX_QUERY_LENGTH) {
      warnings.push(`Query length (${booleanQuery.length}) exceeds recommended maximum of ${this.MAX_QUERY_LENGTH} characters.`);
    }

    // Google Jobs specific notes
    warnings.push('Google Jobs works best with simpler queries.');

    const operatorCount = countOperators(booleanQuery);
    if (operatorCount > this.COMPLEXITY_WARNING_THRESHOLD) {
      warnings.push(`Query complexity (${operatorCount} operators) may reduce result quality.`);
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}
