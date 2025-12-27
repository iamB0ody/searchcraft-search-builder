import { Injectable, signal } from '@angular/core';
import {
  PlatformAdapter,
  PlatformCapabilities,
  PlatformQueryResult,
  QueryPayload,
  ValidationResult,
  IndeedRegion
} from '../../models/platform.model';
import { buildBooleanQuery } from './query-builder.util';

/**
 * Indeed regional domains configuration
 */
export const INDEED_REGIONS: Record<IndeedRegion, { label: string; domain: string }> = {
  'com': { label: 'United States', domain: 'indeed.com' },
  'co.uk': { label: 'United Kingdom', domain: 'indeed.co.uk' },
  'de': { label: 'Germany', domain: 'de.indeed.com' },
  'fr': { label: 'France', domain: 'fr.indeed.com' },
  'ca': { label: 'Canada', domain: 'indeed.ca' },
  'in': { label: 'India', domain: 'indeed.co.in' },
  'au': { label: 'Australia', domain: 'au.indeed.com' }
};

/**
 * Get list of Indeed regions for UI dropdown
 */
export function getIndeedRegionOptions(): { value: IndeedRegion; label: string }[] {
  return Object.entries(INDEED_REGIONS).map(([value, config]) => ({
    value: value as IndeedRegion,
    label: config.label
  }));
}

@Injectable({ providedIn: 'root' })
export class IndeedPlatformAdapter implements PlatformAdapter {
  readonly id = 'indeed';
  readonly label = 'Indeed';
  readonly description = 'Indeed job search with boolean support';
  readonly notes = [
    'Uses minus (-) for exclusions instead of NOT',
    'Location uses separate &l= parameter',
    'Boolean support may vary by region'
  ] as const;
  readonly icon = 'briefcase';
  readonly supportedSearchTypes = ['jobs'] as const;

  private readonly MAX_QUERY_LENGTH = 1000;

  /**
   * UI selector: Current Indeed region
   * Default: 'com' (United States)
   */
  readonly currentRegion = signal<IndeedRegion>('com');

  getCapabilities(): PlatformCapabilities {
    return {
      supportsBoolean: true,
      supportsParentheses: true,
      supportsQuotes: true,
      supportsNot: false, // Indeed uses - instead of NOT
      maxOperators: undefined,
      maxQueryLength: this.MAX_QUERY_LENGTH
    };
  }

  buildQuery(payload: QueryPayload): PlatformQueryResult {
    const result = buildBooleanQuery(payload, {
      notOperator: '-', // Indeed uses - for exclusions
      wrapGroups: true,
      uppercaseOperators: true,
      queryLengthWarning: this.MAX_QUERY_LENGTH
    });

    // Add Indeed-specific warning
    if (result.query && !result.warnings.some(w => w.includes('Indeed'))) {
      result.warnings.push('Indeed Boolean support may vary by region and query complexity.');
    }

    return result;
  }

  buildUrl(payload: QueryPayload, booleanQuery: string): string {
    if (!booleanQuery) return '';

    const domain = INDEED_REGIONS[this.currentRegion()].domain;
    const params = new URLSearchParams();
    params.set('q', booleanQuery);

    // Indeed uses 'l' parameter for location
    if (payload.location?.trim()) {
      params.set('l', payload.location.trim());
    }

    return `https://${domain}/jobs?${params.toString()}`;
  }

  validate(payload: QueryPayload, booleanQuery: string): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (booleanQuery.length > this.MAX_QUERY_LENGTH) {
      warnings.push(`Query length (${booleanQuery.length}) may be too long for Indeed.`);
    }

    // Add Indeed-specific notes
    const region = INDEED_REGIONS[this.currentRegion()];
    warnings.push(`Using Indeed ${region.label} (${region.domain})`);

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }
}
