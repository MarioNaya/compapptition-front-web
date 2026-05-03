// Entry point del runner de tests (Karma + Jasmine).
//
// Aunque la app de producción es zoneless, los tests sí cargan zone.js
// porque Karma + Jasmine se apoyan en él para sincronizar las aserciones
// con la detección de cambios. Esto NO afecta al bundle de producción:
// `tsconfig.spec.json` y `tsconfig.app.json` están aislados, y el JAR
// final no incluye este fichero.

import 'zone.js';
import 'zone.js/testing';

import { getTestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';

getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting(),
);
