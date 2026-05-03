import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { environment } from '@env/environment';

/**
 * Galería de UI sólo se registra en builds NO productivos. En producción
 * la ruta `/_ui` cae al wildcard `**` y devuelve 404 (cierra SF-15).
 */
const UI_GALLERY_ROUTE = environment.production
  ? []
  : [{
      path: '_ui',
      loadComponent: () =>
        import('@features/_ui-gallery/ui-gallery.page').then((m) => m.UiGalleryPage),
    }];

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('@features/landing/landing.page').then((m) => m.LandingPage),
  },
  ...UI_GALLERY_ROUTE,
  {
    // El guestGuard se aplica solo a login/register en `auth.routes.ts`.
    // forgot-password y reset-password deben ser accesibles incluso con
    // sesión activa: si un usuario logueado clica el enlace del email de
    // recuperación, debe poder resetear sin ser redirigido al dashboard.
    path: 'auth',
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
  {
    // Páginas legales (Privacidad, Aviso Legal, Términos). Sin guard:
    // accesibles también sin sesión, para que un usuario potencial pueda
    // consultarlas antes de registrarse y los enlaces del registro funcionen.
    path: 'legal',
    loadChildren: () =>
      import('./features/legal/legal.routes').then((m) => m.LEGAL_ROUTES),
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
