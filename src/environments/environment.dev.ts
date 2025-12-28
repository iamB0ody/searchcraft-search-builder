/**
 * Development/staging environment
 * Used when running `npm run start:dev` or `npm run build:dev`
 */
export const environment = {
  name: 'dev' as const,
  production: false,
  featureFlags: {}
};
