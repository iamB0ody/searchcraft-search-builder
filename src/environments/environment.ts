import { FeatureFlags } from '../app/core/feature-flags/feature-flags.model';

/**
 * Local development environment (default)
 * Used when running `ng serve` or `npm start`
 */
export const environment = {
  name: 'local' as const,
  production: false,
  featureFlags: {
    platforms: {
      // Global platforms
      linkedin: true,
      salesnav: true,
      'google-jobs': true,
      indeed: true,
      // MENA platforms
      bayt: false,
      gulftalent: false,
      naukrigulf: false,
      recruitnet: false,
      bebee: false,
      gulfjobs: false,
      arabjobs: false,
    },
  } as Partial<FeatureFlags>,
};
