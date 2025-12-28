import { TestBed } from '@angular/core/testing';
import { FeatureFlagService } from './feature-flag.service';
import { ALL_PLATFORM_IDS, PlatformId } from '../../models/platform.model';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FeatureFlagService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isPlatformEnabled', () => {
    it('should return true for all platforms by default', () => {
      for (const id of ALL_PLATFORM_IDS) {
        expect(service.isPlatformEnabled(id)).toBe(true);
      }
    });

    it('should return true for global platforms', () => {
      expect(service.isPlatformEnabled('linkedin')).toBe(true);
      expect(service.isPlatformEnabled('salesnav')).toBe(true);
      expect(service.isPlatformEnabled('google-jobs')).toBe(true);
      expect(service.isPlatformEnabled('indeed')).toBe(true);
    });

    it('should return true for MENA platforms', () => {
      expect(service.isPlatformEnabled('bayt')).toBe(true);
      expect(service.isPlatformEnabled('gulftalent')).toBe(true);
      expect(service.isPlatformEnabled('naukrigulf')).toBe(true);
      expect(service.isPlatformEnabled('recruitnet')).toBe(true);
      expect(service.isPlatformEnabled('bebee')).toBe(true);
      expect(service.isPlatformEnabled('gulfjobs')).toBe(true);
      expect(service.isPlatformEnabled('arabjobs')).toBe(true);
    });
  });

  describe('getEnabledPlatformIds', () => {
    it('should return all platform IDs by default', () => {
      const enabled = service.getEnabledPlatformIds();
      expect(enabled.length).toBe(ALL_PLATFORM_IDS.length);
      expect(enabled).toEqual(jasmine.arrayContaining(ALL_PLATFORM_IDS as unknown as PlatformId[]));
    });

    it('should return array containing linkedin', () => {
      const enabled = service.getEnabledPlatformIds();
      expect(enabled).toContain('linkedin');
    });

    it('should return array containing indeed', () => {
      const enabled = service.getEnabledPlatformIds();
      expect(enabled).toContain('indeed');
    });

    it('should return array containing bayt', () => {
      const enabled = service.getEnabledPlatformIds();
      expect(enabled).toContain('bayt');
    });
  });
});
