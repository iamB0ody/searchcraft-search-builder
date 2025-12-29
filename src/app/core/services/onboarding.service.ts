import { Injectable, inject } from '@angular/core';
import { LocalStorageAdapter } from '../storage/local-storage.adapter';

export type UserPersona = 'jobSeeker' | 'recruiter';

export interface OnboardingState {
  schemaVersion: number;
  hasCompleted: boolean;
  persona?: UserPersona;
  completedAt?: string;
  skipped?: boolean;
}

const STORAGE_KEY = 'searchcraft_onboarding';
const SCHEMA_VERSION = 1;

const DEFAULT_STATE: OnboardingState = {
  schemaVersion: SCHEMA_VERSION,
  hasCompleted: false
};

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly storage = inject(LocalStorageAdapter);

  /**
   * Check if user has completed (or skipped) onboarding
   */
  hasCompletedOnboarding(): boolean {
    const state = this.getState();
    return state.hasCompleted;
  }

  /**
   * Get the user's selected persona (if any)
   */
  getPersona(): UserPersona | null {
    const state = this.getState();
    return state.persona ?? null;
  }

  /**
   * Mark onboarding as completed with the selected persona
   */
  completeOnboarding(persona: UserPersona): void {
    const state: OnboardingState = {
      schemaVersion: SCHEMA_VERSION,
      hasCompleted: true,
      persona,
      completedAt: new Date().toISOString(),
      skipped: false
    };
    this.saveState(state);
  }

  /**
   * Mark onboarding as skipped (user chose to skip)
   */
  skipOnboarding(): void {
    const state: OnboardingState = {
      schemaVersion: SCHEMA_VERSION,
      hasCompleted: true,
      skipped: true,
      completedAt: new Date().toISOString()
    };
    this.saveState(state);
  }

  /**
   * Reset onboarding state (show onboarding again)
   */
  resetOnboarding(): void {
    this.storage.remove(STORAGE_KEY);
  }

  /**
   * Check if user skipped onboarding (vs completed it)
   */
  wasSkipped(): boolean {
    const state = this.getState();
    return state.skipped === true;
  }

  private getState(): OnboardingState {
    const raw = this.storage.get(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_STATE;
    }

    try {
      const parsed = JSON.parse(raw) as OnboardingState;
      // Handle future schema migrations if needed
      if (parsed.schemaVersion !== SCHEMA_VERSION) {
        return this.migrateState(parsed);
      }
      return parsed;
    } catch {
      return DEFAULT_STATE;
    }
  }

  private saveState(state: OnboardingState): void {
    this.storage.set(STORAGE_KEY, JSON.stringify(state));
  }

  private migrateState(oldState: OnboardingState): OnboardingState {
    // Future migrations go here
    // For now, just update schema version
    return {
      ...oldState,
      schemaVersion: SCHEMA_VERSION
    };
  }
}
