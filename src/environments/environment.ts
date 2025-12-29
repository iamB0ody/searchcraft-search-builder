import { FeatureFlags } from '../app/core/feature-flags/feature-flags.model';

/**
 * Local development environment (default)
 * Used when running `ng serve` or `npm start`
 */
export const environment = {
  name: 'local' as const,
  production: false,
  featureFlags: {
    platforms: {},
    onboarding: true,
  } as Partial<FeatureFlags>,
};
