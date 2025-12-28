import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

// Log environment name in non-production builds
if (!environment.production) {
  console.log(`Environment: ${environment.name}`);
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
