import { Routes } from '@angular/router';

export const HISTORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/history-list/history-list.page').then(
        m => m.HistoryListPage
      )
  }
];
