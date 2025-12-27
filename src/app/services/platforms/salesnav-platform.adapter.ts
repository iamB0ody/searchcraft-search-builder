import { Injectable } from '@angular/core';
import {
  PlatformAdapter,
  PlatformCapabilities,
  PlatformQueryResult,
  QueryPayload,
  ValidationResult
} from '../../models/platform.model';
import { buildBooleanQuery } from './query-builder.util';

@Injectable({ providedIn: 'root' })
export class SalesNavPlatformAdapter implements PlatformAdapter {
  readonly id = 'salesnav';
  readonly label = 'Sales Navigator';
  readonly description = 'LinkedIn Sales Navigator with 15 operator limit';
  readonly notes = [
    'Limited to 15 boolean operators (AND/OR/NOT)',
    'Best for targeted lead searches',
    'Requires Sales Navigator subscription',
    'Copy query and paste in Sales Navigator search'
  ] as const;
  readonly icon = 'business';
  readonly supportedSearchTypes = ['people'] as const;

  private readonly OPERATOR_LIMIT = 15;
  private readonly OPERATOR_WARNING_THRESHOLD = 12;
  private readonly PEOPLE_BASE_URL = 'https://www.linkedin.com/search/results/people/';

  getCapabilities(): PlatformCapabilities {
    return {
      supportsBoolean: true,
      supportsParentheses: true,
      supportsQuotes: true,
      supportsNot: true,
      maxOperators: this.OPERATOR_LIMIT,
      maxQueryLength: 500
    };
  }

  buildQuery(payload: QueryPayload): PlatformQueryResult {
    const result = buildBooleanQuery(payload, {
      notOperator: 'NOT',
      wrapGroups: true,
      uppercaseOperators: true,
      operatorWarningThreshold: this.OPERATOR_WARNING_THRESHOLD,
      operatorLimit: this.OPERATOR_LIMIT
    });

    // Add Sales Navigator specific warning if query exceeds limit
    if (result.operatorCount > this.OPERATOR_LIMIT) {
      result.warnings = [
        `Sales Navigator supports up to ${this.OPERATOR_LIMIT} Boolean operators. Please simplify your query.`,
        ...result.warnings.filter(w => !w.includes('operator'))
      ];
    }

    return result;
  }

  buildUrl(payload: QueryPayload, booleanQuery: string): string {
    // Use LinkedIn URL as fallback (Sales Navigator URL params not verified)
    // Users can copy the query and paste in Sales Navigator search
    if (!booleanQuery) return '';

    const params = new URLSearchParams();
    params.set('keywords', booleanQuery);
    params.set('origin', 'GLOBAL_SEARCH_HEADER');

    return `${this.PEOPLE_BASE_URL}?${params.toString()}`;
  }

  validate(payload: QueryPayload, booleanQuery: string): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Count operators in the query
    const operatorCount = this.countOperators(booleanQuery);

    if (operatorCount > this.OPERATOR_LIMIT) {
      errors.push(`Query has ${operatorCount} operators but Sales Navigator only supports ${this.OPERATOR_LIMIT}.`);
    } else if (operatorCount >= this.OPERATOR_WARNING_THRESHOLD) {
      warnings.push(`Query has ${operatorCount} operators. Sales Navigator limit is ${this.OPERATOR_LIMIT}.`);
    }

    // Add note about using the query in Sales Navigator
    warnings.push('Tip: Copy the query and paste it directly into Sales Navigator search.');

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  private countOperators(query: string): number {
    if (!query) return 0;
    const andCount = (query.match(/\bAND\b/gi) || []).length;
    const orCount = (query.match(/\bOR\b/gi) || []).length;
    const notCount = (query.match(/\bNOT\b/gi) || []).length;
    return andCount + orCount + notCount;
  }
}
