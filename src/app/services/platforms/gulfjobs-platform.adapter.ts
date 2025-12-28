import { Injectable } from '@angular/core';
import {
  PlatformAdapter,
  PlatformCapabilities,
  PlatformQueryResult,
  QueryPayload,
  ValidationResult
} from '../../models/platform.model';
import { flattenToKeywords, countSimplifiedOperators } from './query-simplifier.util';

@Injectable({ providedIn: 'root' })
export class GulfJobsPlatformAdapter implements PlatformAdapter {
  readonly id = 'gulfjobs';
  readonly label = 'GulfJobs';
  readonly description = 'GulfJobs.com job portal for Gulf region';
  readonly notes = [
    'GulfJobs uses keyword search; Boolean not guaranteed',
    'Query simplified to keywords for best results',
    'Covers UAE, Qatar, Saudi, Kuwait, Bahrain, Oman'
  ] as const;
  readonly icon = 'briefcase-outline';
  readonly supportedSearchTypes = ['jobs'] as const;

  private readonly BASE_URL = 'https://www.gulfjobs.com/jobs-in-gulf/';

  getCapabilities(): PlatformCapabilities {
    return {
      supportsBoolean: false,
      supportsParentheses: false,
      supportsQuotes: true,
      supportsNot: false,
      maxOperators: undefined,
      maxQueryLength: 500,
      booleanLevel: 'none',
      supportsOR: false,
      supportsAND: false,
      supportsMinusExclude: false,
      region: 'mena'
    };
  }

  buildQuery(payload: QueryPayload): PlatformQueryResult {
    const warnings: string[] = [];

    warnings.push('GulfJobs uses keyword search; Boolean operators may not work.');
    warnings.push('Query simplified to keywords.');

    // Flatten to simple keywords (no Boolean operators)
    const query = flattenToKeywords(payload);
    const operatorCount = countSimplifiedOperators(query);

    let badgeStatus: 'safe' | 'warning' | 'danger' = 'safe';
    if (query.length > 200) {
      badgeStatus = 'warning';
      warnings.push('Consider using fewer keywords for better results.');
    }

    return {
      query,
      operatorCount,
      warnings,
      badgeStatus
    };
  }

  buildUrl(payload: QueryPayload, booleanQuery: string): string {
    if (!booleanQuery) return '';

    const params = new URLSearchParams();
    params.set('q', booleanQuery);

    return `${this.BASE_URL}?${params.toString()}`;
  }

  validate(payload: QueryPayload, booleanQuery: string): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    warnings.push('GulfJobs uses keyword search only. Boolean operators are ignored.');

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}
