import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        authService.logout();
        router.navigate(['/auth/login']);
      }

      const errorMessage =
        error.error?.message || error.message || 'Error desconocido';
      console.error('Error HTTP:', errorMessage);

      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        errors: error.error?.validationErrors,
      }));
    }),
  );
};
