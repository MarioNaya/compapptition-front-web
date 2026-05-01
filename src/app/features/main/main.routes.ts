import { Routes } from '@angular/router';
import { adminGuard } from '@core/guards/admin.guard';

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
  // Rutas de detalle sobreviven (accesibles programáticamente desde competición).
  // El listado global se elimina en F9F; por ahora solo se quita el link del navbar.
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
    path: 'matches',
    loadChildren: () =>
      import('@features/matches/matches.routes').then((m) => m.MATCHES_ROUTES),
  },
  {
    path: 'notifications',
    loadChildren: () =>
      import('@features/notifications/notifications.routes').then((m) => m.NOTIFICATIONS_ROUTES),
  },
  {
    path: 'messages',
    loadChildren: () =>
      import('@features/messages/messages.routes').then((m) => m.MESSAGES_ROUTES),
  },
  {
    path: 'profile',
    loadChildren: () => import('@features/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('@features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
