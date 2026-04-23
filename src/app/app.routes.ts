import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { guestGuard } from '@core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('@features/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: '_ui',
    loadComponent: () =>
      import('@features/_ui-gallery/ui-gallery.page').then((m) => m.UiGalleryPage),
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@layout/auth-layout/auth-layout').then((m) => m.AuthLayout),
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@layout/main-layout/main-layout').then((m) => m.MainLayout),
    loadChildren: () =>
      import('./features/main/main.routes').then((m) => m.MAIN_ROUTES),
  },
  // Legacy redirects — rutas viejas sin prefijo /app/ seguían apuntando a la shell.
  // Se mantienen durante 1-2 semanas post-F9A para no romper enlaces externos/emails.
  { path: 'dashboard', redirectTo: '/app/dashboard', pathMatch: 'full' },
  { path: 'competitions', redirectTo: '/app/competitions', pathMatch: 'prefix' },
  { path: 'invitations', redirectTo: '/app/invitations', pathMatch: 'prefix' },
  { path: 'profile', redirectTo: '/app/profile', pathMatch: 'prefix' },
  { path: 'admin', redirectTo: '/app/admin', pathMatch: 'prefix' },
  {
    path: '**',
    loadComponent: () =>
      import('@features/_errors/not-found.page').then((m) => m.NotFoundPage),
  },
];
