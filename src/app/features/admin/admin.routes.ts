import { Routes } from '@angular/router';
import { adminGuard } from '@core/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./dashboard/admin-dashboard.page').then((m) => m.AdminDashboardPage),
      },
      {
        path: 'sports',
        loadComponent: () =>
          import('./sports/sports-list.page').then((m) => m.SportsListPage),
      },
      {
        path: 'stat-types',
        loadComponent: () =>
          import('./stat-types/stat-types.page').then((m) => m.StatTypesPage),
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users.page').then((m) => m.AdminUsersPage),
      },
      {
        path: 'logs',
        loadComponent: () => import('./logs/logs.page').then((m) => m.AdminLogsPage),
      },
    ],
  },
];
