import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { OnboardingService } from './onboarding.service';
import { LocalStorageAdapter } from '../storage/local-storage.adapter';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let storage: LocalStorageAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    storage = TestBed.inject(LocalStorageAdapter);
    storage.clear();
    service = TestBed.inject(OnboardingService);
  });

  afterEach(() => {
    storage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('hasCompletedOnboarding', () => {
    it('should return false for new users', () => {
      expect(service.hasCompletedOnboarding()).toBeFalse();
    });

    it('should return true after completing onboarding', () => {
      service.completeOnboarding('jobSeeker');
      expect(service.hasCompletedOnboarding()).toBeTrue();
    });

    it('should return true after skipping onboarding', () => {
      service.skipOnboarding();
      expect(service.hasCompletedOnboarding()).toBeTrue();
    });
  });

  describe('getPersona', () => {
    it('should return null for new users', () => {
      expect(service.getPersona()).toBeNull();
    });

    it('should return jobSeeker after completing as job seeker', () => {
      service.completeOnboarding('jobSeeker');
      expect(service.getPersona()).toBe('jobSeeker');
    });

    it('should return recruiter after completing as recruiter', () => {
      service.completeOnboarding('recruiter');
      expect(service.getPersona()).toBe('recruiter');
    });

    it('should return null after skipping', () => {
      service.skipOnboarding();
      expect(service.getPersona()).toBeNull();
    });
  });

  describe('completeOnboarding', () => {
    it('should persist persona selection', () => {
      service.completeOnboarding('recruiter');

      // Create new instance to verify persistence
      const newService = TestBed.inject(OnboardingService);
      expect(newService.getPersona()).toBe('recruiter');
      expect(newService.hasCompletedOnboarding()).toBeTrue();
    });

    it('should set skipped to false', () => {
      service.completeOnboarding('jobSeeker');
      expect(service.wasSkipped()).toBeFalse();
    });
  });

  describe('skipOnboarding', () => {
    it('should mark as completed but skipped', () => {
      service.skipOnboarding();

      expect(service.hasCompletedOnboarding()).toBeTrue();
      expect(service.wasSkipped()).toBeTrue();
      expect(service.getPersona()).toBeNull();
    });
  });

  describe('resetOnboarding', () => {
    it('should clear completion state', () => {
      service.completeOnboarding('jobSeeker');
      expect(service.hasCompletedOnboarding()).toBeTrue();

      service.resetOnboarding();
      expect(service.hasCompletedOnboarding()).toBeFalse();
      expect(service.getPersona()).toBeNull();
    });

    it('should allow onboarding to show again', () => {
      service.skipOnboarding();
      service.resetOnboarding();

      expect(service.hasCompletedOnboarding()).toBeFalse();
      expect(service.wasSkipped()).toBeFalse();
    });
  });

  describe('wasSkipped', () => {
    it('should return false for new users', () => {
      expect(service.wasSkipped()).toBeFalse();
    });

    it('should return false after completing normally', () => {
      service.completeOnboarding('recruiter');
      expect(service.wasSkipped()).toBeFalse();
    });

    it('should return true after skipping', () => {
      service.skipOnboarding();
      expect(service.wasSkipped()).toBeTrue();
    });
  });

  describe('storage handling', () => {
    it('should handle corrupted storage gracefully', () => {
      storage.set('searchcraft_onboarding', 'invalid json');

      expect(service.hasCompletedOnboarding()).toBeFalse();
      expect(service.getPersona()).toBeNull();
    });

    it('should handle missing storage gracefully', () => {
      storage.remove('searchcraft_onboarding');

      expect(service.hasCompletedOnboarding()).toBeFalse();
      expect(service.getPersona()).toBeNull();
    });
  });
});
