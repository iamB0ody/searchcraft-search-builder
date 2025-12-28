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
export class ArabJobsPlatformAdapter implements PlatformAdapter {
  readonly id = 'arabjobs';
  readonly label = 'ArabJobs';
  readonly description = 'ArabJobs.com job portal for Arab region';
  readonly notes = [
    'ArabJobs uses keyword search; Boolean not guaranteed',
    'Query simplified to keywords for best results',
    'Arabic and English terms can be mixed',
    'Covers Egypt, Saudi Arabia, UAE, Qatar, Kuwait, Gulf'
  ] as const;
  readonly icon = 'briefcase-outline';
  readonly supportedSearchTypes = ['jobs'] as const;

  private readonly BASE_URL = 'https://www.arabjobs.com/en/jobs/search/';

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

    warnings.push('ArabJobs uses keyword search; Boolean operators may not work.');
    warnings.push('Query simplified to keywords. Arabic/English terms supported.');

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
    params.set('keywords', booleanQuery);

    return `${this.BASE_URL}?${params.toString()}`;
  }

  validate(payload: QueryPayload, booleanQuery: string): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    warnings.push('ArabJobs uses keyword search only. Boolean operators are ignored.');
    warnings.push('You can mix Arabic and English terms in your search.');

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}
