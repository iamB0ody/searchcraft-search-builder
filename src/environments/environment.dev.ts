import { FeatureFlags } from '../app/core/feature-flags/feature-flags.model';

/**
 * Development/staging environment
 * Used when running `npm run start:dev` or `npm run build:dev`
 */
export const environment = {
  name: 'dev' as const,
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
