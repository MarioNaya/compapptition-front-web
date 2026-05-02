import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withViewTransitions, withInMemoryScrolling } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { refreshInterceptor } from '@core/interceptors/refresh.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es' },
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    // Orden importa: auth añade Authorization, refresh maneja 401 (con
    // single-flight + retry tras refrescar el token), error normaliza el
    // mensaje al UI. Cualquier 401 manejado por refresh nunca llega a error.
    provideHttpClient(withInterceptors([authInterceptor, refreshInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
  ],
};
