import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

registerLocaleData(localeEs);

bootstrapApplication(App, appConfig)
  .catch((err) => {
    // En producción no exponemos el error de bootstrap por consola del browser
    // (cierra SF-16). Si el bundle falla al arrancar, el navegador igualmente
    // muestra el error en su devtools nativo si están abiertas.
    if (!environment.production) {
      console.error(err);
    }
  });
