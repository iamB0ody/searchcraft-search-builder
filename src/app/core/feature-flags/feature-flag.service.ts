import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PlatformId, ALL_PLATFORM_IDS } from '../../models/platform.model';
import { FeatureFlags, DEFAULT_FEATURE_FLAGS } from './feature-flags.model';

/**
 * Service for managing feature flags
 * Merges default flags with environment-specific overrides
 */
@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly flags: FeatureFlags;

  constructor() {
    this.flags = this.mergeFlags(
      DEFAULT_FEATURE_FLAGS,
      environment.featureFlags
    );
  }

  /**
   * Check if a platform is enabled
   * @param id Platform identifier
   * @returns true if enabled, false if disabled (defaults to true)
   */
  isPlatformEnabled(id: PlatformId): boolean {
    return this.flags.platforms[id] ?? true;
  }

  /**
   * Get list of all enabled platform IDs
   * @returns Array of enabled platform identifiers
   */
  getEnabledPlatformIds(): PlatformId[] {
    return ALL_PLATFORM_IDS.filter(id => this.isPlatformEnabled(id));
  }

  /**
   * Merge default flags with environment overrides
   * Environment values take precedence over defaults
   */
  private mergeFlags(
    defaults: FeatureFlags,
    overrides?: Partial<FeatureFlags>
  ): FeatureFlags {
    return {
      platforms: {
        ...defaults.platforms,
        ...overrides?.platforms
      }
    };
  }
}
