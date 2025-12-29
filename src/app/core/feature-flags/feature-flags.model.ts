import { PlatformId } from '../../models/platform.model';

/**
 * Feature flags configuration interface
 * Extend this interface to add new feature flag categories
 */
export interface FeatureFlags {
  /** Platform enable/disable flags - undefined means enabled (default true) */
  platforms: Partial<Record<PlatformId, boolean>>;
  /** Enable/disable onboarding modal for new users */
  onboarding?: boolean;
}

/**
 * Default feature flags configuration
 * All platforms enabled by default
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  platforms: {
    // Global platforms - enabled by default
    'linkedin': true,
    'salesnav': true,
    'google-jobs': true,
    'indeed': true,
    // MENA platforms - enabled by default
    'bayt': true,
    'gulftalent': true,
    'naukrigulf': true,
    'recruitnet': true,
    'bebee': true,
    'gulfjobs': true,
    'arabjobs': true
  },
  onboarding: true
};
