import { Routes } from '@angular/router';

export const MAIN_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('@features/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'competitions',
    loadChildren: () =>
      import('@features/competitions/competitions.routes').then((m) => m.COMPETITION_ROUTES),
  },
  {
    path: 'teams',
    loadChildren: () => import('@features/teams/teams.routes').then((m) => m.TEAM_ROUTES),
  },
  {
    path: 'players',
    loadChildren: () => import('@features/players/players.routes').then((m) => m.PLAYER_ROUTES),
  },
  {
    path: 'invitations',
    loadChildren: () =>
      import('@features/invitations/invitations.routes').then((m) => m.INVITATION_ROUTES),
  },
  {
    path: 'profile',
    loadChildren: () => import('@features/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
  },
  {
    path: 'admin',
    loadChildren: () => import('@features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
