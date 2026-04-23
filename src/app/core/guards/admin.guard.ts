import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';

/**
 * Endurecido en F9A: además de exigir autenticación, requiere `esAdminSistema === true`
 * en el usuario del AuthService. Los endpoints del backend siguen validando con @PreAuthorize;
 * este guard evita que el usuario no-admin acceda siquiera a las páginas del panel.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const user = authService.currentUser();
  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }
  if (!user.esAdminSistema) {
    toast.error('No tienes permisos de administrador de sistema');
    router.navigate(['/app/dashboard']);
    return false;
  }
  return true;
};
