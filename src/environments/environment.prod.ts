import { FeatureFlags } from '../app/core/feature-flags/feature-flags.model';

/**
 * Production environment
 * Used when running `npm run build:prod`
 */
export const environment = {
  name: 'prod' as const,
  production: true,
  featureFlags: {
    platforms: {},
  } as Partial<FeatureFlags>,
};
