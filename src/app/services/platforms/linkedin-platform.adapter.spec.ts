import { TestBed } from '@angular/core/testing';
import { LinkedInPlatformAdapter } from './linkedin-platform.adapter';
import { QueryPayload } from '../../models/platform.model';
import { SearchFormModel } from '../../models/search-form.model';

describe('LinkedInPlatformAdapter', () => {
  let adapter: LinkedInPlatformAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    adapter = TestBed.inject(LinkedInPlatformAdapter);
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  describe('static properties', () => {
    it('should have correct id', () => {
      expect(adapter.id).toBe('linkedin');
    });

    it('should have correct label', () => {
      expect(adapter.label).toBe('LinkedIn');
    });

    it('should support both people and jobs search', () => {
      expect(adapter.supportedSearchTypes).toEqual(['people', 'jobs']);
    });
  });

  describe('buildUrl for Jobs', () => {
    const createJobsPayload = (formOverrides: Partial<SearchFormModel> = {}): QueryPayload => ({
      searchType: 'jobs',
      titles: [],
      skills: [],
      exclude: [],
      filters: {
        searchType: 'jobs',
        titles: [],
        skills: [],
        exclude: [],
        location: '',
        mode: 'linkedin',
        sortBy: 'relevant',
        datePosted: 'any',
        jobTypes: [],
        experienceLevels: [],
        workTypes: [],
        easyApply: false,
        hasVerifications: false,
        underTenApplicants: false,
        inYourNetwork: false,
        fairChanceEmployer: false,
        connectionLevels: [],
        profileLanguages: [],
        firstName: '',
        lastName: '',
        keywordTitle: '',
        keywordCompany: '',
        keywordSchool: '',
        ...formOverrides
      } as unknown as Record<string, unknown>
    });

    describe('inYourNetwork filter', () => {
      it('should add f_JIYN=true when inYourNetwork is true', () => {
        const url = adapter.buildUrl(createJobsPayload({ inYourNetwork: true }), 'Angular');
        expect(url).toContain('f_JIYN=true');
      });

      it('should not add f_JIYN when inYourNetwork is false', () => {
        const url = adapter.buildUrl(createJobsPayload({ inYourNetwork: false }), 'Angular');
        expect(url).not.toContain('f_JIYN');
      });
    });

    describe('fairChanceEmployer filter', () => {
      it('should add f_FCE=true when fairChanceEmployer is true', () => {
        const url = adapter.buildUrl(createJobsPayload({ fairChanceEmployer: true }), 'Angular');
        expect(url).toContain('f_FCE=true');
      });

      it('should not add f_FCE when fairChanceEmployer is false', () => {
        const url = adapter.buildUrl(createJobsPayload({ fairChanceEmployer: false }), 'Angular');
        expect(url).not.toContain('f_FCE');
      });
    });

    describe('combined filters', () => {
      it('should include both params when both toggles are on', () => {
        const url = adapter.buildUrl(createJobsPayload({
          inYourNetwork: true,
          fairChanceEmployer: true
        }), 'Angular');
        expect(url).toContain('f_JIYN=true');
        expect(url).toContain('f_FCE=true');
      });

      it('should preserve existing params when toggles are on', () => {
        const url = adapter.buildUrl(createJobsPayload({
          location: 'San Francisco',
          inYourNetwork: true,
          fairChanceEmployer: true
        }), 'Angular');
        expect(url).toContain('keywords=Angular');
        expect(url).toContain('location=San+Francisco');
        expect(url).toContain('f_JIYN=true');
        expect(url).toContain('f_FCE=true');
      });
    });

    describe('datePosted filter', () => {
      it('should add f_TPR=r3600 for past hour', () => {
        const url = adapter.buildUrl(createJobsPayload({ datePosted: 'hour' }), 'Angular');
        expect(url).toContain('f_TPR=r3600');
      });

      it('should add f_TPR=r7200 for past 2 hours', () => {
        const url = adapter.buildUrl(createJobsPayload({ datePosted: 'hours2' }), 'Angular');
        expect(url).toContain('f_TPR=r7200');
      });

      it('should add f_TPR=r21600 for past 6 hours', () => {
        const url = adapter.buildUrl(createJobsPayload({ datePosted: 'hours6' }), 'Angular');
        expect(url).toContain('f_TPR=r21600');
      });

      it('should add f_TPR=r43200 for past 12 hours', () => {
        const url = adapter.buildUrl(createJobsPayload({ datePosted: 'hours12' }), 'Angular');
        expect(url).toContain('f_TPR=r43200');
      });

      it('should add f_TPR=r86400 for past 24 hours', () => {
        const url = adapter.buildUrl(createJobsPayload({ datePosted: 'day' }), 'Angular');
        expect(url).toContain('f_TPR=r86400');
      });

      it('should add f_TPR=r259200 for past 3 days', () => {
        const url = adapter.buildUrl(createJobsPayload({ datePosted: 'days3' }), 'Angular');
        expect(url).toContain('f_TPR=r259200');
      });

      it('should add f_TPR=r604800 for past week', () => {
        const url = adapter.buildUrl(createJobsPayload({ datePosted: 'week' }), 'Angular');
        expect(url).toContain('f_TPR=r604800');
      });

      it('should add f_TPR=r2592000 for past month', () => {
        const url = adapter.buildUrl(createJobsPayload({ datePosted: 'month' }), 'Angular');
        expect(url).toContain('f_TPR=r2592000');
      });

      it('should not add f_TPR when datePosted is any', () => {
        const url = adapter.buildUrl(createJobsPayload({ datePosted: 'any' }), 'Angular');
        expect(url).not.toContain('f_TPR');
      });
    });

    describe('all filters together', () => {
      it('should combine all new filters correctly', () => {
        const url = adapter.buildUrl(createJobsPayload({
          datePosted: 'hour',
          inYourNetwork: true,
          fairChanceEmployer: true,
          easyApply: true
        }), 'Angular');
        expect(url).toContain('f_TPR=r3600');
        expect(url).toContain('f_JIYN=true');
        expect(url).toContain('f_FCE=true');
        expect(url).toContain('f_AL=true');
        expect(url).toContain('keywords=Angular');
      });
    });
  });
});
