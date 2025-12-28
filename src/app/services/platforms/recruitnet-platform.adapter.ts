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
export class RecruitNetPlatformAdapter implements PlatformAdapter {
  readonly id = 'recruitnet';
  readonly label = 'Recruit.net';
  readonly description = 'Recruit.net job aggregator';
  readonly notes = [
    'Recruit.net is a job aggregator; Boolean not guaranteed',
    'Query simplified to keywords for best results',
    'URL may vary; paste query in search box if needed'
  ] as const;
  readonly icon = 'search-outline';
  readonly supportedSearchTypes = ['jobs'] as const;

  private readonly BASE_URL = 'https://www.recruit.net/browse-jobs';

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
      region: 'global'
    };
  }

  buildQuery(payload: QueryPayload): PlatformQueryResult {
    const warnings: string[] = [];

    warnings.push('Recruit.net is an aggregator; Boolean operators are not supported.');
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

    warnings.push('Recruit.net uses keyword search only. Boolean operators are ignored.');

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}
