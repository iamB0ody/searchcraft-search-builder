import { Routes } from '@angular/router';

export const PRESETS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/presets-list/presets-list.page').then(
        m => m.PresetsListPage
      )
  },
  {
    path: 'import',
    loadComponent: () =>
      import('./pages/preset-import/preset-import.page').then(
        m => m.PresetImportPage
      )
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/preset-edit/preset-edit.page').then(
        m => m.PresetEditPage
      )
  }
];
