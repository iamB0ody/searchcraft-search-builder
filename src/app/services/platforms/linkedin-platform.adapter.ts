import { Injectable } from '@angular/core';
import {
  PlatformAdapter,
  PlatformCapabilities,
  PlatformQueryResult,
  QueryPayload,
  ValidationResult
} from '../../models/platform.model';
import {
  SearchFormModel,
  DatePosted,
  ExperienceLevel,
  WorkType,
  SortBy,
  JobType,
  ConnectionLevel
} from '../../models/search-form.model';
import { buildBooleanQuery } from './query-builder.util';

// LinkedIn URL parameter mappings
const DATE_POSTED_MAP: Record<DatePosted, string> = {
  'any': '',
  'day': 'r86400',
  'week': 'r604800',
  'month': 'r2592000'
};

const EXPERIENCE_LEVEL_MAP: Record<ExperienceLevel, string> = {
  'internship': '1',
  'entry': '2',
  'associate': '3',
  'mid-senior': '4',
  'director': '5',
  'executive': '6'
};

const WORK_TYPE_MAP: Record<WorkType, string> = {
  'onsite': '1',
  'remote': '2',
  'hybrid': '3'
};

const SORT_BY_MAP: Record<SortBy, string> = {
  'relevant': 'R',
  'recent': 'DD'
};

const JOB_TYPE_MAP: Record<JobType, string> = {
  'full-time': 'F',
  'part-time': 'P',
  'contract': 'C',
  'temporary': 'T',
  'internship': 'I',
  'other': 'O'
};

const CONNECTION_LEVEL_MAP: Record<ConnectionLevel, string> = {
  '1st': 'F',
  '2nd': 'S',
  '3rd+': 'O'
};

@Injectable({ providedIn: 'root' })
export class LinkedInPlatformAdapter implements PlatformAdapter {
  readonly id = 'linkedin';
  readonly label = 'LinkedIn';
  readonly description = 'Standard LinkedIn search with full boolean support';
  readonly notes = [
    'Supports up to 500 characters in query',
    'Full parentheses and quotes support',
    'Use for basic LinkedIn people and job searches'
  ] as const;
  readonly icon = 'logo-linkedin';
  readonly supportedSearchTypes = ['people', 'jobs'] as const;

  private readonly PEOPLE_BASE_URL = 'https://www.linkedin.com/search/results/people/';
  private readonly JOBS_BASE_URL = 'https://www.linkedin.com/jobs/search/';
  private readonly MAX_QUERY_LENGTH = 500;
  private readonly OPERATOR_WARNING_THRESHOLD = 10;
  private readonly QUERY_LENGTH_WARNING = 250;

  getCapabilities(): PlatformCapabilities {
    return {
      supportsBoolean: true,
      supportsParentheses: true,
      supportsQuotes: true,
      supportsNot: true,
      maxOperators: undefined,
      maxQueryLength: this.MAX_QUERY_LENGTH
    };
  }

  buildQuery(payload: QueryPayload): PlatformQueryResult {
    return buildBooleanQuery(payload, {
      notOperator: 'NOT',
      wrapGroups: true,
      uppercaseOperators: true,
      operatorWarningThreshold: this.OPERATOR_WARNING_THRESHOLD,
      queryLengthWarning: this.QUERY_LENGTH_WARNING
    });
  }

  buildUrl(payload: QueryPayload, booleanQuery: string): string {
    if (!booleanQuery) return '';

    // Convert QueryPayload to SearchFormModel for compatibility
    const form = payload.filters as unknown as SearchFormModel | undefined;
    if (!form) {
      // Build minimal URL if no form filters
      const params = new URLSearchParams();
      params.set('keywords', booleanQuery);

      if (payload.searchType === 'people') {
        params.set('origin', 'GLOBAL_SEARCH_HEADER');
        return `${this.PEOPLE_BASE_URL}?${params.toString()}`;
      }
      if (payload.location) {
        params.set('location', payload.location);
      }
      return `${this.JOBS_BASE_URL}?${params.toString()}`;
    }

    if (payload.searchType === 'people') {
      return this.buildPeopleUrl(booleanQuery, form);
    }
    return this.buildJobsUrl(booleanQuery, form);
  }

  validate(payload: QueryPayload, booleanQuery: string): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (booleanQuery.length > this.MAX_QUERY_LENGTH) {
      warnings.push(`Query length (${booleanQuery.length}) exceeds recommended maximum of ${this.MAX_QUERY_LENGTH} characters.`);
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  private buildPeopleUrl(query: string, form: SearchFormModel): string {
    const params = new URLSearchParams();
    params.set('keywords', query);
    params.set('origin', 'GLOBAL_SEARCH_HEADER');

    if (form.connectionLevels?.length > 0) {
      const levels = form.connectionLevels
        .map(level => CONNECTION_LEVEL_MAP[level])
        .join(',');
      params.set('network', `["${levels.split(',').join('","')}"]`);
    }

    if (form.profileLanguages?.length > 0) {
      params.set('profileLanguage', `["${form.profileLanguages.join('","')}"]`);
    }

    if (form.firstName?.trim()) {
      params.set('firstName', form.firstName.trim());
    }
    if (form.lastName?.trim()) {
      params.set('lastName', form.lastName.trim());
    }
    if (form.keywordTitle?.trim()) {
      params.set('title', form.keywordTitle.trim());
    }
    if (form.keywordCompany?.trim()) {
      params.set('company', form.keywordCompany.trim());
    }
    if (form.keywordSchool?.trim()) {
      params.set('school', form.keywordSchool.trim());
    }

    return `${this.PEOPLE_BASE_URL}?${params.toString()}`;
  }

  private buildJobsUrl(query: string, form: SearchFormModel): string {
    const params = new URLSearchParams();
    params.set('keywords', query);

    if (form.location?.trim()) {
      params.set('location', form.location.trim());
    }

    if (form.sortBy && form.sortBy !== 'relevant') {
      params.set('sortBy', SORT_BY_MAP[form.sortBy]);
    }

    if (form.datePosted && form.datePosted !== 'any') {
      const dateValue = DATE_POSTED_MAP[form.datePosted];
      if (dateValue) {
        params.set('f_TPR', dateValue);
      }
    }

    if (form.jobTypes?.length > 0) {
      const types = form.jobTypes
        .map(type => JOB_TYPE_MAP[type])
        .join(',');
      params.set('f_JT', types);
    }

    if (form.experienceLevels?.length > 0) {
      const levels = form.experienceLevels
        .map(level => EXPERIENCE_LEVEL_MAP[level])
        .join(',');
      params.set('f_E', levels);
    }

    if (form.workTypes?.length > 0) {
      const types = form.workTypes
        .map(type => WORK_TYPE_MAP[type])
        .join(',');
      params.set('f_WT', types);
    }

    if (form.easyApply) {
      params.set('f_AL', 'true');
    }

    if (form.hasVerifications) {
      params.set('f_SB2', '6');
    }

    if (form.underTenApplicants) {
      params.set('f_EA', 'true');
    }

    return `${this.JOBS_BASE_URL}?${params.toString()}`;
  }
}
