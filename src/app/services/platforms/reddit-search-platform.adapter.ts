import { Injectable } from '@angular/core';
import {
  PlatformAdapter,
  PlatformCapabilities,
  PlatformQueryResult,
  QueryPayload,
  ValidationResult
} from '../../models/platform.model';
import { buildSimplifiedPostsQuery } from './posts-query-builder.util';
import { createDefaultPostsPayload, PostsDateRange } from '../../models/posts-payload.model';

// Reddit time filter mapping
const DATE_RANGE_MAP: Record<PostsDateRange, string> = {
  'any': 'all',
  '24h': 'day',
  '7d': 'week'
};

@Injectable({ providedIn: 'root' })
export class RedditSearchPlatformAdapter implements PlatformAdapter {
  readonly id = 'reddit-search';
  readonly label = 'Reddit';
  readonly description = 'Search Reddit for job posts, hiring threads, and career discussions';
  readonly notes = [
    'Great for finding job posts in tech communities (r/cscareerquestions, r/jobs)',
    'Quotes supported for exact phrase matching',
    'Subreddits like r/forhire and r/jobbit are popular for job postings'
  ] as const;
  readonly icon = 'logo-reddit';
  readonly supportedSearchTypes = ['posts'] as const;

  private readonly BASE_URL = 'https://www.reddit.com/search/';
  private readonly QUERY_LENGTH_WARNING = 300;

  getCapabilities(): PlatformCapabilities {
    return {
      supportsBoolean: true,
      supportsParentheses: false,
      supportsQuotes: true,
      supportsNot: false,
      maxQueryLength: 512,
      booleanLevel: 'partial',
      supportsOR: true,
      supportsAND: false,
      supportsMinusExclude: true,
      region: 'global',
      supportsHashtags: false,
      supportsDateRange: true
    };
  }

  buildQuery(payload: QueryPayload): PlatformQueryResult {
    const postsPayload = payload.postsPayload || createDefaultPostsPayload();

    // Use simplified query builder for Reddit (limited boolean)
    const result = buildSimplifiedPostsQuery(postsPayload, {
      supportsHashtags: false
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
    params.set('q', booleanQuery);
    params.set('type', 'link'); // Search posts/links

    // Apply date range filter if specified
    const postsPayload = payload.postsPayload;
    if (postsPayload?.dateRange) {
      const timeFilter = DATE_RANGE_MAP[postsPayload.dateRange];
      if (timeFilter) {
        params.set('t', timeFilter);
      }
    }

    // Sort by relevance
    params.set('sort', 'relevance');

    return `${this.BASE_URL}?${params.toString()}`;
  }

  validate(payload: QueryPayload, booleanQuery: string): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (booleanQuery.length > this.QUERY_LENGTH_WARNING) {
      warnings.push(`Query length (${booleanQuery.length}) may reduce result quality.`);
    }

    if (!booleanQuery.trim()) {
      errors.push('Query cannot be empty for Reddit search.');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}
