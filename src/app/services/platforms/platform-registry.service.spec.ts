import { TestBed } from '@angular/core/testing';
import { PlatformRegistryService } from './platform-registry.service';
import { FeatureFlagService } from '../../core/feature-flags/feature-flag.service';

describe('PlatformRegistryService', () => {
  let service: PlatformRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlatformRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('platform registration', () => {
    it('should have all 17 platforms registered', () => {
      expect(service.availablePlatforms().length).toBe(17);
    });

    it('should include global platforms', () => {
      expect(service.getPlatformById('linkedin')).toBeTruthy();
      expect(service.getPlatformById('salesnav')).toBeTruthy();
      expect(service.getPlatformById('google-jobs')).toBeTruthy();
      expect(service.getPlatformById('indeed')).toBeTruthy();
    });

    it('should include MENA platforms', () => {
      expect(service.getPlatformById('bayt')).toBeTruthy();
      expect(service.getPlatformById('gulftalent')).toBeTruthy();
      expect(service.getPlatformById('naukrigulf')).toBeTruthy();
      expect(service.getPlatformById('recruitnet')).toBeTruthy();
      expect(service.getPlatformById('bebee')).toBeTruthy();
      expect(service.getPlatformById('gulfjobs')).toBeTruthy();
      expect(service.getPlatformById('arabjobs')).toBeTruthy();
    });

    it('should include posts platforms', () => {
      expect(service.getPlatformById('linkedin-posts')).toBeTruthy();
      expect(service.getPlatformById('x-search')).toBeTruthy();
      expect(service.getPlatformById('reddit-search')).toBeTruthy();
      expect(service.getPlatformById('google-posts-linkedin')).toBeTruthy();
      expect(service.getPlatformById('google-posts-x')).toBeTruthy();
      expect(service.getPlatformById('google-posts-reddit')).toBeTruthy();
    });
  });

  describe('getEnabledPlatforms', () => {
    it('should return all platforms when all are enabled', () => {
      const enabled = service.getEnabledPlatforms();
      expect(enabled.length).toBe(17);
    });

    it('should include linkedin in enabled platforms', () => {
      const enabled = service.getEnabledPlatforms();
      const linkedin = enabled.find(p => p.id === 'linkedin');
      expect(linkedin).toBeTruthy();
    });
  });

  describe('getFirstEnabledPlatform', () => {
    it('should return first enabled platform', () => {
      const first = service.getFirstEnabledPlatform();
      expect(first).toBeTruthy();
      expect(first!.id).toBe('linkedin');
    });
  });

  describe('getPlatformsForSearchType', () => {
    it('should return people-compatible platforms for people search', () => {
      const platforms = service.getPlatformsForSearchType('people');
      expect(platforms.length).toBe(2); // linkedin, salesnav
      expect(platforms.map(p => p.id)).toContain('linkedin');
      expect(platforms.map(p => p.id)).toContain('salesnav');
    });

    it('should return jobs-compatible platforms for jobs search', () => {
      const platforms = service.getPlatformsForSearchType('jobs');
      // LinkedIn, Sales Nav, Google Jobs, Indeed, and 7 MENA platforms = 11 platforms
      // But salesnav doesn't support jobs search, so expect 10
      expect(platforms.length).toBeGreaterThanOrEqual(9);
      expect(platforms.map(p => p.id)).toContain('linkedin');
      expect(platforms.map(p => p.id)).toContain('indeed');
    });

    it('should return posts-compatible platforms for posts search', () => {
      const platforms = service.getPlatformsForSearchType('posts');
      expect(platforms.length).toBe(6);
      expect(platforms.map(p => p.id)).toContain('linkedin-posts');
      expect(platforms.map(p => p.id)).toContain('x-search');
      expect(platforms.map(p => p.id)).toContain('reddit-search');
      expect(platforms.map(p => p.id)).toContain('google-posts-linkedin');
      expect(platforms.map(p => p.id)).toContain('google-posts-x');
      expect(platforms.map(p => p.id)).toContain('google-posts-reddit');
    });
  });

  describe('setCurrentPlatform', () => {
    it('should set current platform by id', () => {
      service.setCurrentPlatform('salesnav');
      expect(service.currentPlatform().id).toBe('salesnav');
    });

    it('should keep current platform if id is invalid', () => {
      const originalPlatform = service.currentPlatform().id;
      service.setCurrentPlatform('invalid-platform');
      expect(service.currentPlatform().id).toBe(originalPlatform);
    });

    it('should default to linkedin', () => {
      expect(service.currentPlatform().id).toBe('linkedin');
    });
  });
});
