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
  },
  {
    path: 'history',
    loadChildren: () =>
      import('./features/history/history.routes').then(
        m => m.HISTORY_ROUTES
      )
  }
];
