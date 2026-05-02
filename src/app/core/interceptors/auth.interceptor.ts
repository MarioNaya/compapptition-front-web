import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@env/environment';
import { AuthService } from '@core/services/auth.service';

/**
 * Inyecta la cabecera {@code Authorization: Bearer <token>} solo en peticiones
 * dirigidas al backend de Compapption ({@code environment.apiUrl}). Cualquier
 * petición a un dominio externo (Cloudinary, mapas, fuentes, terceros) sale
 * sin token; cierra AF-6 y SF-6.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const token = inject(AuthService).getToken();
  if (!token) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
};
