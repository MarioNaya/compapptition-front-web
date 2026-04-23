import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * El admin guard actualmente sólo verifica autenticación. El filtro real (rol ADMIN_SISTEMA)
 * lo aplica el backend con @PreAuthorize en los endpoints de admin; cualquier operación
 * sin permiso devolverá 403 y el errorInterceptor mostrará el mensaje.
 *
 * Cuando el DTO de usuario exponga `esAdminSistema`, este guard puede endurecerse para
 * bloquear la entrada incluso al panel.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }
  return true;
};
