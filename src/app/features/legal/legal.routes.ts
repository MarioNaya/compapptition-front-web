import { Routes } from '@angular/router';

/**
 * Rutas de páginas legales — Privacidad, Aviso Legal y Términos de Uso.
 * Públicas (sin auth guard) para que un usuario pueda consultarlas antes
 * de registrarse y para que los enlaces de registro/aceptación funcionen
 * sin sesión.
 */
export const LEGAL_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'privacidad',
  },
  {
    path: 'privacidad',
    loadComponent: () =>
      import('./privacidad/privacidad.page').then((m) => m.PrivacidadPage),
    title: 'Política de privacidad · Compapption',
  },
  {
    path: 'aviso-legal',
    loadComponent: () =>
      import('./aviso-legal/aviso-legal.page').then((m) => m.AvisoLegalPage),
    title: 'Aviso legal · Compapption',
  },
  {
    path: 'terminos',
    loadComponent: () =>
      import('./terminos/terminos.page').then((m) => m.TerminosPage),
    title: 'Términos de uso · Compapption',
  },
];
