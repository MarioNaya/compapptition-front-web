import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  filter,
  Observable,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '@core/services/auth.service';

/**
 * Estado compartido entre invocaciones del interceptor para implementar el
 * patrón "single-flight": cuando una request recibe un 401, todas las
 * peticiones concurrentes que llegan después esperan a que el primer
 * refresh termine (en lugar de disparar N refresh paralelos que se
 * invalidarían entre sí por la rotación). Cierra AF-7.
 *
 * - {@code isRefreshing}: true mientras hay una llamada a /auth/refresh en curso.
 * - {@code accessTokenSubject}: emite el nuevo access token cuando refresh
 *   tiene éxito (los esperando lo recogen). Emite {@code null} mientras se
 *   está refrescando.
 */
let isRefreshing = false;
const accessTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Excluimos los propios endpoints de auth (login, refresh, logout, etc.) y
 * cualquier petición fuera del backend de Compapptition: si /auth/login
 * devuelve 401 es credenciales inválidas, no caducidad de sesión.
 */
function shouldHandle(req: HttpRequest<unknown>): boolean {
  if (!req.url.startsWith(environment.apiUrl)) return false;
  if (req.url.includes('/auth/')) return false;
  return true;
}

function retryWithToken(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  token: string,
): Observable<HttpEvent<unknown>> {
  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
}

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || !shouldHandle(req)) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        // Ya hay un refresh en vuelo; esperamos su resultado y reintentamos.
        return accessTokenSubject.pipe(
          filter((token): token is string => token !== null),
          take(1),
          switchMap((token) => retryWithToken(req, next, token)),
        );
      }

      isRefreshing = true;
      accessTokenSubject.next(null);

      return auth.refreshToken().pipe(
        switchMap((response) => {
          isRefreshing = false;
          accessTokenSubject.next(response.accessToken);
          return retryWithToken(req, next, response.accessToken);
        }),
        catchError((refreshErr) => {
          isRefreshing = false;
          accessTokenSubject.next(null);
          // Refresh ha fallado definitivamente: no podemos recuperar la sesión.
          // Limpiamos estado local y redirigimos a login (sin disparar otro
          // POST /auth/logout que también devolvería 401).
          auth.clearSession();
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
