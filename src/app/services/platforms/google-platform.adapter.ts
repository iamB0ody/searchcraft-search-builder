import { Injectable, signal } from '@angular/core';
import {
  PlatformAdapter,
  PlatformCapabilities,
  PlatformQueryResult,
  QueryPayload,
  ValidationResult
} from '../../models/platform.model';
import { SearchType } from '../../models/search-form.model';
import { buildBooleanQuery } from './query-builder.util';

@Injectable({ providedIn: 'root' })
export class GooglePlatformAdapter implements PlatformAdapter {
  readonly id = 'google';
  readonly label = 'Google';
  readonly description = 'Google X-ray search for LinkedIn profiles';
  readonly notes = [
    'Uses minus (-) for exclusions instead of NOT',
    'Toggle to restrict results to LinkedIn profiles',
    'Best for finding profiles not visible in LinkedIn search'
  ] as const;
  readonly icon = 'logo-google';
  readonly supportedSearchTypes = ['people', 'jobs'] as const;

  private readonly BASE_URL = 'https://www.google.com/search';
  private readonly MAX_QUERY_LENGTH = 2048;
  private readonly PEOPLE_SITE_PREFIX = 'site:linkedin.com/in';
  private readonly JOBS_SITE_PREFIX = 'site:linkedin.com/jobs';

  /**
   * UI toggle: Restrict search to LinkedIn profiles/jobs
   * Default: true (enabled)
   */
  readonly restrictToLinkedIn = signal(true);

  getCapabilities(): PlatformCapabilities {
    return {
      supportsBoolean: true,
      supportsParentheses: true,
      supportsQuotes: true,
      supportsNot: false, // Google uses - instead of NOT
      maxOperators: undefined,
      maxQueryLength: this.MAX_QUERY_LENGTH
    };
  }

  buildQuery(payload: QueryPayload): PlatformQueryResult {
    // Determine site prefix based on search type and toggle
    let sitePrefix: string | undefined;
    if (this.restrictToLinkedIn()) {
      sitePrefix = payload.searchType === 'jobs'
        ? this.JOBS_SITE_PREFIX
        : this.PEOPLE_SITE_PREFIX;
    }

    const result = buildBooleanQuery(payload, {
      notOperator: '-', // Google uses - for exclusions
      sitePrefix,
      wrapGroups: true,
      uppercaseOperators: true,
      queryLengthWarning: this.MAX_QUERY_LENGTH
    });

    // Add Google-specific warnings
    if (result.query && !result.warnings.some(w => w.includes('Google'))) {
      result.warnings.push('Google may interpret Boolean operators differently than LinkedIn.');
    }

    return result;
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

    if (booleanQuery.length > this.MAX_QUERY_LENGTH) {
      warnings.push(`Query length (${booleanQuery.length}) exceeds recommended maximum of ${this.MAX_QUERY_LENGTH} characters.`);
    }

    // Google-specific notes
    warnings.push('Google may ignore parentheses in some cases.');
    if (!this.restrictToLinkedIn()) {
      warnings.push('Without site: restriction, results may include non-LinkedIn pages.');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}
