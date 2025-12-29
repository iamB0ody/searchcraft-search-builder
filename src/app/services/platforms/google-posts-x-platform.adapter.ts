import { Injectable } from '@angular/core';
import {
  PlatformAdapter,
  PlatformCapabilities,
  PlatformQueryResult,
  QueryPayload,
  ValidationResult
} from '../../models/platform.model';
import { buildPostsQuery } from './posts-query-builder.util';
import { createDefaultPostsPayload } from '../../models/posts-payload.model';

@Injectable({ providedIn: 'root' })
export class GooglePostsXPlatformAdapter implements PlatformAdapter {
  readonly id = 'google-posts-x';
  readonly label = 'Google \u2192 X';
  readonly description = 'Use Google to search X (Twitter) posts with full boolean support';
  readonly notes = [
    'Full boolean support (AND, OR, NOT, parentheses)',
    'Can find older tweets that X search might not surface',
    'Good for comprehensive searches across public tweets'
  ] as const;
  readonly icon = 'logo-google';
  readonly supportedSearchTypes = ['posts'] as const;

  private readonly BASE_URL = 'https://www.google.com/search';
  private readonly SITE_PREFIX = 'site:x.com';
  private readonly QUERY_LENGTH_WARNING = 500;
  private readonly OPERATOR_WARNING_THRESHOLD = 12;

  getCapabilities(): PlatformCapabilities {
    return {
      supportsBoolean: true,
      supportsParentheses: true,
      supportsQuotes: true,
      supportsNot: false, // Google uses minus (-) for exclusions
      maxQueryLength: 2048,
      booleanLevel: 'good',
      supportsOR: true,
      supportsAND: true,
      supportsMinusExclude: true,
      region: 'global',
      supportsHashtags: false,
      supportsDateRange: false
    };
  }

  buildQuery(payload: QueryPayload): PlatformQueryResult {
    const postsPayload = payload.postsPayload || createDefaultPostsPayload();

    const result = buildPostsQuery(postsPayload, {
      notOperator: '-',
      wrapGroups: true,
      uppercaseOperators: true,
      supportsHashtags: false,
      queryLengthWarning: this.QUERY_LENGTH_WARNING,
      operatorWarningThreshold: this.OPERATOR_WARNING_THRESHOLD
    });

    return {
      query: result.query,
      operatorCount: result.operatorCount,
      warnings: result.warnings,
      badgeStatus: result.badgeStatus
    };
  }

  buildUrl(payload: QueryPayload, booleanQuery: string): string {
    if (!booleanQuery) return '';

    // Combine site prefix with the query
    const fullQuery = `${this.SITE_PREFIX} ${booleanQuery}`;

    const params = new URLSearchParams();
    params.set('q', fullQuery);

    return `${this.BASE_URL}?${params.toString()}`;
  }

  validate(payload: QueryPayload, booleanQuery: string): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    const fullQueryLength = this.SITE_PREFIX.length + 1 + booleanQuery.length;
    if (fullQueryLength > 2048) {
      warnings.push(`Total query length (${fullQueryLength}) may exceed Google's limit.`);
    }

    if (!booleanQuery.trim()) {
      warnings.push('Empty query will search all X posts (may return many results).');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}
