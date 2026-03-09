import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();
  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  // Check for ADMIN_SISTEMA role
  if (
    (user as any).rol === 'ADMIN_SISTEMA' ||
    (user as any).roles?.includes('ADMIN_SISTEMA')
  ) {
    return true;
  }

  router.navigate(['/home']);
  return false;
};
