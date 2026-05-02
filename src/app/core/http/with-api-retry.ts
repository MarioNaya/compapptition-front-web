import { HttpErrorResponse } from '@angular/common/http';
import { Observable, retry, timer } from 'rxjs';

/**
 * Operador RxJS que reintenta una vez la petición ante errores transitorios
 * (HTTP 0 sin red, 5xx, 408 timeout) con un pequeño delay exponencial.
 * No reintenta ante 4xx (son errores del cliente o de negocio que no se
 * arreglarán reintentando) ni ante 401 (lo gestiona refresh.interceptor).
 *
 * Pensado para usarse SOLO en operaciones idempotentes (GETs). Aplicar a
 * mutaciones causaría dobles efectos secundarios. Cierra AF-5 (helper de
 * retry centralizado en lugar de cada service hacer el suyo).
 *
 * <p>Uso:
 * <pre>
 *   this.http.get<T>(url).pipe(withApiRetry()).subscribe(...);
 * </pre>
 */
export function withApiRetry<T>() {
  return (source: Observable<T>): Observable<T> =>
    source.pipe(
      retry({
        count: 1,
        delay: (error, attempt) => {
          if (!isRetriable(error)) {
            // Sin reintento: re-throw inmediato.
            throw error;
          }
          // Backoff exponencial corto: 250ms · 500ms.
          return timer(250 * Math.pow(2, attempt - 1));
        },
      }),
    );
}

function isRetriable(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) return false;
  const s = error.status;
  // 0 = sin red / CORS bloqueado en preflight; 408 = timeout cliente;
  // 5xx = error de servidor transitorio.
  return s === 0 || s === 408 || (s >= 500 && s < 600);
}
