import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { guestGuard } from '@core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
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
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@layout/main-layout/main-layout').then((m) => m.MainLayout),
    loadChildren: () =>
      import('./features/main/main.routes').then((m) => m.MAIN_ROUTES),
  },
  { path: '**', redirectTo: '/dashboard' },
];
