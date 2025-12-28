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
export class BaytPlatformAdapter implements PlatformAdapter {
  readonly id = 'bayt';
  readonly label = 'Bayt';
  readonly description = 'Bayt.com job search for MENA region';
  readonly notes = [
    'Bayt supports keyword search with limited Boolean',
    'Complex queries may be simplified',
    'Best for Gulf and Middle East job searches'
  ] as const;
  readonly icon = 'briefcase-outline';
  readonly supportedSearchTypes = ['jobs'] as const;

  private readonly BASE_URL = 'https://www.bayt.com/en/international/jobs/';

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

    // Always add platform guidance
    warnings.push('Bayt has limited Boolean support; complex queries are simplified.');

    // Use simplified boolean (OR for titles, keywords for skills)
    const query = simplifyBoolean(payload);
    const operatorCount = countSimplifiedOperators(query);

    // Complexity warnings
    if (operatorCount > 5) {
      warnings.push('Consider simplifying your search for better results on Bayt.');
    }

    // Determine badge status
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
    params.set('q', booleanQuery);

    return `${this.BASE_URL}?${params.toString()}`;
  }

  validate(payload: QueryPayload, booleanQuery: string): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    warnings.push('Bayt works best with simpler keyword searches.');

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
