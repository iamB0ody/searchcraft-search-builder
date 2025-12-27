import { Injectable } from '@angular/core';
import {
  SearchFormModel,
  DatePosted,
  ExperienceLevel,
  WorkType,
  SortBy,
  JobType,
  ConnectionLevel
} from '../models/search-form.model';

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

// People filter mappings
const CONNECTION_LEVEL_MAP: Record<ConnectionLevel, string> = {
  '1st': 'F',
  '2nd': 'S',
  '3rd+': 'O'
};

@Injectable({ providedIn: 'root' })
export class LinkedinUrlBuilderService {
  private readonly PEOPLE_BASE_URL = 'https://www.linkedin.com/search/results/people/';
  private readonly JOBS_BASE_URL = 'https://www.linkedin.com/jobs/search/';

  buildUrl(form: SearchFormModel, query: string): string {
    if (!query) return '';

    if (form.searchType === 'people') {
      return this.buildPeopleUrl(query, form);
    }
    return this.buildJobsUrl(query, form);
  }

  buildPeopleUrl(query: string, form: SearchFormModel): string {
    const params = new URLSearchParams();
    params.set('keywords', query);
    params.set('origin', 'GLOBAL_SEARCH_HEADER');

    // Connection Levels (multi-select)
    if (form.connectionLevels?.length > 0) {
      const levels = form.connectionLevels
        .map(level => CONNECTION_LEVEL_MAP[level])
        .join(',');
      params.set('network', `["${levels.split(',').join('","')}"]`);
    }

    // Profile Languages (multi-select)
    if (form.profileLanguages?.length > 0) {
      params.set('profileLanguage', `["${form.profileLanguages.join('","')}"]`);
    }

    // Keyword filters
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

  buildJobsUrl(query: string, form: SearchFormModel): string {
    const params = new URLSearchParams();
    params.set('keywords', query);

    // Location
    if (form.location?.trim()) {
      params.set('location', form.location.trim());
    }

    // Sort By
    if (form.sortBy && form.sortBy !== 'relevant') {
      params.set('sortBy', SORT_BY_MAP[form.sortBy]);
    }

    // Date Posted
    if (form.datePosted && form.datePosted !== 'any') {
      const dateValue = DATE_POSTED_MAP[form.datePosted];
      if (dateValue) {
        params.set('f_TPR', dateValue);
      }
    }

    // Job Types (multi-select)
    if (form.jobTypes?.length > 0) {
      const types = form.jobTypes
        .map(type => JOB_TYPE_MAP[type])
        .join(',');
      params.set('f_JT', types);
    }

    // Experience Levels (multi-select)
    if (form.experienceLevels?.length > 0) {
      const levels = form.experienceLevels
        .map(level => EXPERIENCE_LEVEL_MAP[level])
        .join(',');
      params.set('f_E', levels);
    }

    // Work Types (multi-select)
    if (form.workTypes?.length > 0) {
      const types = form.workTypes
        .map(type => WORK_TYPE_MAP[type])
        .join(',');
      params.set('f_WT', types);
    }

    // Easy Apply
    if (form.easyApply) {
      params.set('f_AL', 'true');
    }

    // Has Verifications
    if (form.hasVerifications) {
      params.set('f_SB2', '6');
    }

    // Under 10 Applicants
    if (form.underTenApplicants) {
      params.set('f_EA', 'true');
    }

    return `${this.JOBS_BASE_URL}?${params.toString()}`;
  }
}
