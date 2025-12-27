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
 * Indeed regional domains configuration (63 countries)
 * Sorted alphabetically by country name for dropdown UX
 */
export const INDEED_REGIONS: Record<IndeedRegion, { label: string; domain: string }> = {
  // Americas
  'ar': { label: 'Argentina', domain: 'ar.indeed.com' },
  'br': { label: 'Brazil', domain: 'br.indeed.com' },
  'ca': { label: 'Canada', domain: 'indeed.ca' },
  'cl': { label: 'Chile', domain: 'cl.indeed.com' },
  'co': { label: 'Colombia', domain: 'co.indeed.com' },
  'ec': { label: 'Ecuador', domain: 'ec.indeed.com' },
  'mx': { label: 'Mexico', domain: 'mx.indeed.com' },
  'pe': { label: 'Peru', domain: 'pe.indeed.com' },
  'com': { label: 'United States', domain: 'indeed.com' },
  've': { label: 'Venezuela', domain: 've.indeed.com' },

  // Europe
  'at': { label: 'Austria', domain: 'at.indeed.com' },
  'be': { label: 'Belgium', domain: 'be.indeed.com' },
  'cz': { label: 'Czech Republic', domain: 'cz.indeed.com' },
  'dk': { label: 'Denmark', domain: 'dk.indeed.com' },
  'fi': { label: 'Finland', domain: 'fi.indeed.com' },
  'fr': { label: 'France', domain: 'fr.indeed.com' },
  'de': { label: 'Germany', domain: 'de.indeed.com' },
  'gr': { label: 'Greece', domain: 'gr.indeed.com' },
  'hu': { label: 'Hungary', domain: 'hu.indeed.com' },
  'ie': { label: 'Ireland', domain: 'ie.indeed.com' },
  'it': { label: 'Italy', domain: 'it.indeed.com' },
  'lu': { label: 'Luxembourg', domain: 'lu.indeed.com' },
  'nl': { label: 'Netherlands', domain: 'nl.indeed.com' },
  'no': { label: 'Norway', domain: 'no.indeed.com' },
  'pl': { label: 'Poland', domain: 'pl.indeed.com' },
  'pt': { label: 'Portugal', domain: 'pt.indeed.com' },
  'ro': { label: 'Romania', domain: 'ro.indeed.com' },
  'ru': { label: 'Russia', domain: 'ru.indeed.com' },
  'sk': { label: 'Slovakia', domain: 'sk.indeed.com' },
  'es': { label: 'Spain', domain: 'es.indeed.com' },
  'se': { label: 'Sweden', domain: 'se.indeed.com' },
  'ch': { label: 'Switzerland', domain: 'ch.indeed.com' },
  'tr': { label: 'Turkey', domain: 'tr.indeed.com' },
  'ua': { label: 'Ukraine', domain: 'ua.indeed.com' },
  'co.uk': { label: 'United Kingdom', domain: 'indeed.co.uk' },

  // Asia-Pacific
  'au': { label: 'Australia', domain: 'au.indeed.com' },
  'bd': { label: 'Bangladesh', domain: 'bd.indeed.com' },
  'cn': { label: 'China', domain: 'cn.indeed.com' },
  'hk': { label: 'Hong Kong', domain: 'hk.indeed.com' },
  'in': { label: 'India', domain: 'indeed.co.in' },
  'id': { label: 'Indonesia', domain: 'id.indeed.com' },
  'jp': { label: 'Japan', domain: 'jp.indeed.com' },
  'kr': { label: 'South Korea', domain: 'kr.indeed.com' },
  'my': { label: 'Malaysia', domain: 'my.indeed.com' },
  'nz': { label: 'New Zealand', domain: 'nz.indeed.com' },
  'pk': { label: 'Pakistan', domain: 'pk.indeed.com' },
  'ph': { label: 'Philippines', domain: 'ph.indeed.com' },
  'sg': { label: 'Singapore', domain: 'sg.indeed.com' },
  'tw': { label: 'Taiwan', domain: 'tw.indeed.com' },
  'th': { label: 'Thailand', domain: 'th.indeed.com' },
  'vn': { label: 'Vietnam', domain: 'vn.indeed.com' },

  // Middle East & Africa
  'ae': { label: 'United Arab Emirates', domain: 'ae.indeed.com' },
  'bh': { label: 'Bahrain', domain: 'bh.indeed.com' },
  'eg': { label: 'Egypt', domain: 'eg.indeed.com' },
  'il': { label: 'Israel', domain: 'il.indeed.com' },
  'ke': { label: 'Kenya', domain: 'ke.indeed.com' },
  'kw': { label: 'Kuwait', domain: 'kw.indeed.com' },
  'ma': { label: 'Morocco', domain: 'ma.indeed.com' },
  'ng': { label: 'Nigeria', domain: 'ng.indeed.com' },
  'om': { label: 'Oman', domain: 'om.indeed.com' },
  'qa': { label: 'Qatar', domain: 'qa.indeed.com' },
  'sa': { label: 'Saudi Arabia', domain: 'sa.indeed.com' },
  'za': { label: 'South Africa', domain: 'za.indeed.com' }
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
