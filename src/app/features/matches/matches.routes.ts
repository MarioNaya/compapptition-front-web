import { Routes } from '@angular/router';

export const MATCHES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/matches-list.page').then((m) => m.MatchesListPage),
  },
];
