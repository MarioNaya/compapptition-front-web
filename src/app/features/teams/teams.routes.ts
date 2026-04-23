import { Routes } from '@angular/router';

export const TEAM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/teams-list.page').then((m) => m.TeamsListPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./new/new-team.page').then((m) => m.NewTeamPage),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./edit/edit-team.page').then((m) => m.EditTeamPage),
  },
  {
    path: ':id',
    loadComponent: () => import('./detail/team-detail.page').then((m) => m.TeamDetailPage),
  },
];
