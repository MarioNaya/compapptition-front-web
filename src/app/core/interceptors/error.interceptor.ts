import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';
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

/**
 * Sanitiza la URL antes de loggearla: elimina cualquier parámetro `token`
 * (recovery, SSE) que pudiera filtrarse a la consola del navegador o a
 * herramientas de monitorización (cierra SF-8). Conserva el resto.
 */
function sanitizarUrl(url: string): string {
  return url.replace(/([?&])token=[^&]*/g, '$1token=<redacted>');
}

/**
 * Interceptor de presentación: normaliza errores HTTP en un objeto con
 * {@code message} + {@code status} + {@code errors} para consumo del UI.
 *
 * No gestiona 401: la renovación de sesión la hace
 * {@link './refresh.interceptor'} (single-flight) y el cierre definitivo
 * lo dispara {@code AuthService.clearSession()} desde dentro de ese
 * interceptor cuando el refresh falla.
 *
 * En producción NO emite {@code console.error} para no exponer cuerpos de
 * respuesta sensibles desde DevTools / extensiones (cierra SF-8).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = resolveUserMessage(error);
      if (!environment.production) {
        console.error('[HTTP]', error.status, req.method, sanitizarUrl(req.url), error.error ?? error.message);
      }

      return throwError(() => ({
        status: error.status,
        message,
        errors: error.error?.validationErrors,
      }));
    }),
  );
};
