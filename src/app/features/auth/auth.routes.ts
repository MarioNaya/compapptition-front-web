import { Routes } from '@angular/router';
import { guestGuard } from '@core/guards/guest.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./register/register.page').then((m) => m.RegisterPage),
  },
  {
    // forgot-password y reset-password sin guestGuard: un usuario con sesión
    // activa también debe poder usar el flujo de recuperación si recibe el
    // email tras pedirlo desde otro dispositivo o tras expirar el JWT.
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
