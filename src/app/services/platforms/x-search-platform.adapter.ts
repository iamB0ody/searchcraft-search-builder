import { Injectable } from '@angular/core';
import {
  PlatformAdapter,
  PlatformCapabilities,
  PlatformQueryResult,
  QueryPayload,
  ValidationResult
} from '../../models/platform.model';
import { buildPostsQuery } from './posts-query-builder.util';
import { createDefaultPostsPayload, PostsDateRange } from '../../models/posts-payload.model';

@Injectable({ providedIn: 'root' })
export class XSearchPlatformAdapter implements PlatformAdapter {
  readonly id = 'x-search';
  readonly label = 'X (Twitter)';
  readonly description = 'Search X for job posts, hiring announcements, and talent posts';
  readonly notes = [
    'Good boolean support with OR and minus (-) operators',
    'Hashtags are commonly used (#hiring, #jobs, #remotework)',
    'Results show most recent posts by default'
  ] as const;
  readonly icon = 'logo-twitter';
  readonly supportedSearchTypes = ['posts'] as const;

  private readonly BASE_URL = 'https://x.com/search';
  private readonly QUERY_LENGTH_WARNING = 500;
  private readonly OPERATOR_WARNING_THRESHOLD = 10;

  getCapabilities(): PlatformCapabilities {
    return {
      supportsBoolean: true,
      supportsParentheses: true,
      supportsQuotes: true,
      supportsNot: false, // X uses minus (-) for exclusions
      maxQueryLength: 500,
      booleanLevel: 'good',
      supportsOR: true,
      supportsAND: false, // X uses implicit AND (space-separated)
      supportsMinusExclude: true,
      region: 'global',
      supportsHashtags: true,
      supportsDateRange: true
    };
  }

  buildQuery(payload: QueryPayload): PlatformQueryResult {
    const postsPayload = payload.postsPayload || createDefaultPostsPayload();

    const result = buildPostsQuery(postsPayload, {
      notOperator: '-',
      wrapGroups: true,
      uppercaseOperators: true,
      supportsHashtags: true,
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

    const params = new URLSearchParams();

    // Build query with date range if specified
    let finalQuery = booleanQuery;
    const postsPayload = payload.postsPayload;

    if (postsPayload?.dateRange && postsPayload.dateRange !== 'any') {
      const dateFilter = this.getDateFilter(postsPayload.dateRange);
      if (dateFilter) {
        finalQuery = `${booleanQuery} ${dateFilter}`;
      }
    }

    params.set('q', finalQuery);
    params.set('f', 'live'); // Show latest posts

    return `${this.BASE_URL}?${params.toString()}`;
  }

  validate(payload: QueryPayload, booleanQuery: string): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (booleanQuery.length > this.QUERY_LENGTH_WARNING) {
      warnings.push(`Query length (${booleanQuery.length}) may be too long.`);
    }

    if (!booleanQuery.trim()) {
      errors.push('Query cannot be empty for X search.');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Get X date filter operator
   */
  private getDateFilter(dateRange: PostsDateRange): string {
    const now = new Date();
    let targetDate: Date;

    switch (dateRange) {
      case '24h':
        targetDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        targetDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        return '';
    }

    // Format: since:YYYY-MM-DD
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');

    return `since:${year}-${month}-${day}`;
  }
}
