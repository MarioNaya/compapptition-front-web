import { Routes } from '@angular/router';

export const COMPETITION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/competitions-list.page').then((m) => m.CompetitionsListPage),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./new/new-competition.page').then((m) => m.NewCompetitionPage),
  },
  {
    path: ':competicionId/edit',
    loadComponent: () =>
      import('./edit/edit-competition.page').then((m) => m.EditCompetitionPage),
  },
  {
    path: ':competicionId',
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./detail/competition-detail.page').then((m) => m.CompetitionDetailPage),
      },
      {
        path: '',
        loadChildren: () => import('@features/events/events.routes').then((m) => m.EVENT_ROUTES),
      },
    ],
  },
];
