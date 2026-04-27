import { Routes } from '@angular/router';

export const PLAYER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/players-list.page').then((m) => m.PlayersListPage),
  },
  {
    path: 'vinculaciones',
    loadComponent: () =>
      import('./vinculaciones/vinculaciones.page').then((m) => m.VinculacionesPage),
  },
  {
    path: ':id',
    loadComponent: () => import('./detail/player-detail.page').then((m) => m.PlayerDetailPage),
  },
];
