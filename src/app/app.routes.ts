import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'search-builder',
    pathMatch: 'full'
  },
  {
    path: 'search-builder',
    loadComponent: () =>
      import('./pages/search-builder/search-builder.page').then(
        m => m.SearchBuilderPage
      )
  },
  {
    path: 'presets',
    loadChildren: () =>
      import('./features/presets/presets.routes').then(
        m => m.PRESETS_ROUTES
      )
  }
];
