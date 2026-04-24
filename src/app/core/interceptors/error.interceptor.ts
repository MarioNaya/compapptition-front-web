import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { M } from '@shared/messages';

/**
 * Devuelve el mensaje que mostraremos al usuario.
 * Prioridad: mensaje de negocio del backend (si existe y es texto útil) → mensaje
 * genérico por código de estado. Nunca deja escapar el `message` técnico de
 * HttpErrorResponse (p.ej. "Http failure response for ...: 0 Unknown Error").
 */
function resolveUserMessage(error: HttpErrorResponse): string {
  const backendMsg = typeof error.error?.message === 'string' ? error.error.message.trim() : '';

  if (error.status === 0) {
    return navigator.onLine ? M.network.serverUnreachable : M.network.offline;
  }
  if (error.status === 408 || error.status === 504) return M.network.timeout;
  if (error.status >= 500) return M.network.serverError;

  return backendMsg || M.generic.genericError;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        authService.logout();
        router.navigate(['/auth/login']);
      }

      const message = resolveUserMessage(error);
      console.error('[HTTP]', error.status, req.method, req.url, error.error ?? error.message);

      return throwError(() => ({
        status: error.status,
        message,
        errors: error.error?.validationErrors,
      }));
    }),
  );
};
