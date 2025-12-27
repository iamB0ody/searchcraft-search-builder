import { Injectable } from '@angular/core';
import {
  SearchFormModel,
  DatePosted,
  ExperienceLevel,
  WorkType
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

@Injectable({ providedIn: 'root' })
export class LinkedinUrlBuilderService {
  private readonly PEOPLE_BASE_URL = 'https://www.linkedin.com/search/results/people/';
  private readonly JOBS_BASE_URL = 'https://www.linkedin.com/jobs/search/';

  buildUrl(form: SearchFormModel, query: string): string {
    if (!query) return '';

    if (form.searchType === 'people') {
      return this.buildPeopleUrl(query);
    }
    return this.buildJobsUrl(query, form);
  }

  buildPeopleUrl(query: string): string {
    const params = new URLSearchParams();
    params.set('keywords', query);
    params.set('origin', 'GLOBAL_SEARCH_HEADER');
    return `${this.PEOPLE_BASE_URL}?${params.toString()}`;
  }

  buildJobsUrl(query: string, form: SearchFormModel): string {
    const params = new URLSearchParams();
    params.set('keywords', query);

    // Location
    if (form.location?.trim()) {
      params.set('location', form.location.trim());
    }

    // Date Posted
    if (form.datePosted && form.datePosted !== 'any') {
      const dateValue = DATE_POSTED_MAP[form.datePosted];
      if (dateValue) {
        params.set('f_TPR', dateValue);
      }
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

    return `${this.JOBS_BASE_URL}?${params.toString()}`;
  }
}
