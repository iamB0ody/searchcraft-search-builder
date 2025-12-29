import { Injectable } from '@angular/core';
import {
  PlatformAdapter,
  PlatformCapabilities,
  PlatformQueryResult,
  QueryPayload,
  ValidationResult
} from '../../models/platform.model';
import { BadgeStatus } from '../../models/search-form.model';
import { buildPostsQuery, buildSimplifiedPostsQuery } from './posts-query-builder.util';
import { createDefaultPostsPayload } from '../../models/posts-payload.model';

@Injectable({ providedIn: 'root' })
export class LinkedInPostsPlatformAdapter implements PlatformAdapter {
  readonly id = 'linkedin-posts';
  readonly label = 'LinkedIn Posts';
  readonly description = 'Search LinkedIn posts and articles for job opportunities and talent posts';
  readonly notes = [
    'Best for finding job posts shared by recruiters and companies',
    'Also finds "open to work" posts from candidates',
    'Hashtags are supported (e.g., #hiring, #opentowork)'
  ] as const;
  readonly icon = 'logo-linkedin';
  readonly supportedSearchTypes = ['posts'] as const;

  private readonly BASE_URL = 'https://www.linkedin.com/search/results/content/';
  private readonly QUERY_LENGTH_WARNING = 300;
  private readonly OPERATOR_WARNING_THRESHOLD = 8;

  getCapabilities(): PlatformCapabilities {
    return {
      supportsBoolean: true,
      supportsParentheses: false, // LinkedIn content search has limited boolean
      supportsQuotes: true,
      supportsNot: false,
      maxQueryLength: 500,
      booleanLevel: 'partial',
      supportsOR: true,
      supportsAND: false,
      supportsMinusExclude: true,
      region: 'global',
      supportsHashtags: true,
      supportsDateRange: false
    };
  }

  buildQuery(payload: QueryPayload): PlatformQueryResult {
    const postsPayload = payload.postsPayload || createDefaultPostsPayload();

    // Use simplified query builder for LinkedIn Posts (limited boolean support)
    const result = buildSimplifiedPostsQuery(postsPayload, {
      supportsHashtags: true
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
    params.set('keywords', booleanQuery);
    params.set('origin', 'FACETED_SEARCH');
    params.set('sid', 'posts');

    return `${this.BASE_URL}?${params.toString()}`;
  }

  validate(payload: QueryPayload, booleanQuery: string): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (booleanQuery.length > this.QUERY_LENGTH_WARNING) {
      warnings.push(`Query length (${booleanQuery.length}) may be too long for optimal results.`);
    }

    if (!booleanQuery.trim()) {
      warnings.push('Empty query will return general posts feed.');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}
