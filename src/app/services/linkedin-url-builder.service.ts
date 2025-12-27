import { Injectable } from '@angular/core';
import { SearchFormModel } from '../models/search-form.model';

@Injectable({ providedIn: 'root' })
export class LinkedinUrlBuilderService {
  private readonly PEOPLE_BASE_URL = 'https://www.linkedin.com/search/results/people/';
  private readonly JOBS_BASE_URL = 'https://www.linkedin.com/jobs/search/';

  buildUrl(form: SearchFormModel, query: string): string {
    if (!query) return '';

    if (form.searchType === 'people') {
      return this.buildPeopleUrl(query);
    }
    return this.buildJobsUrl(query, form.location);
  }

  buildPeopleUrl(query: string): string {
    const params = new URLSearchParams();
    params.set('keywords', query);
    params.set('origin', 'GLOBAL_SEARCH_HEADER');
    return `${this.PEOPLE_BASE_URL}?${params.toString()}`;
  }

  buildJobsUrl(query: string, location?: string): string {
    const params = new URLSearchParams();
    params.set('keywords', query);
    if (location?.trim()) {
      params.set('location', location.trim());
    }
    return `${this.JOBS_BASE_URL}?${params.toString()}`;
  }
}
