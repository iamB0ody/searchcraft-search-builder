import { Injectable } from '@angular/core';
import {
  PlatformAdapter,
  PlatformCapabilities,
  PlatformQueryResult,
  QueryPayload,
  ValidationResult
} from '../../models/platform.model';
import { simplifyBoolean, countSimplifiedOperators } from './query-simplifier.util';

@Injectable({ providedIn: 'root' })
export class NaukriGulfPlatformAdapter implements PlatformAdapter {
  readonly id = 'naukrigulf';
  readonly label = 'NaukriGulf';
  readonly description = 'NaukriGulf job search for Gulf region';
  readonly notes = [
    'NaukriGulf supports keyword search with limited Boolean',
    'Popular in UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman',
    'Queries are simplified for compatibility'
  ] as const;
  readonly icon = 'briefcase-outline';
  readonly supportedSearchTypes = ['jobs'] as const;

  private readonly BASE_URL = 'https://www.naukrigulf.com/search-jobs/';

  getCapabilities(): PlatformCapabilities {
    return {
      supportsBoolean: true,
      supportsParentheses: false,
      supportsQuotes: true,
      supportsNot: false,
      maxOperators: undefined,
      maxQueryLength: 500,
      booleanLevel: 'partial',
      supportsOR: true,
      supportsAND: false,
      supportsMinusExclude: true,
      region: 'mena'
    };
  }

  buildQuery(payload: QueryPayload): PlatformQueryResult {
    const warnings: string[] = [];

    warnings.push('NaukriGulf has limited Boolean support; complex queries are simplified.');

    const query = simplifyBoolean(payload);
    const operatorCount = countSimplifiedOperators(query);

    if (operatorCount > 5) {
      warnings.push('Consider simplifying your search for better NaukriGulf results.');
    }

    let badgeStatus: 'safe' | 'warning' | 'danger' = 'safe';
    if (operatorCount > 8) {
      badgeStatus = 'danger';
    } else if (operatorCount > 4) {
      badgeStatus = 'warning';
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

    warnings.push('NaukriGulf works best with simpler keyword searches.');

    const operatorCount = countSimplifiedOperators(booleanQuery);
    if (operatorCount > 5) {
      warnings.push(`Query has ${operatorCount} operators. Consider simplifying.`);
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}
