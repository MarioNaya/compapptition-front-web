# Compapptition · Frontend Web

[![Angular](https://img.shields.io/badge/Angular-21.2-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SCSS](https://img.shields.io/badge/SCSS-design%20system%20propio-CC6699?logo=sass&logoColor=white)](https://sass-lang.com/)
[![Karma](https://img.shields.io/badge/Karma-219%2F219-brightgreen)](#tests)
[![Playwright](https://img.shields.io/badge/Playwright-14%2F14-2EAD33?logo=playwright)](#tests)
[![License](https://img.shields.io/badge/license-academic-blue)](#licencia)

> 🚀 **Pruébala en producción:** la _beta_ de Compapptition está desplegada y abierta a feedback en **[https://compapptition.com](https://compapptition.com)**. Puedes registrarte y crear una competición de prueba en menos de un minuto.

Frontend web de **Compapptition**, app para la gestión integral de competiciones deportivas amateur. Single Page Application construida con **Angular 21.2 zoneless + signals** y un sistema de diseño propio en **SCSS** con tokens (variables CSS), integrada 1-a-1 con el backend Spring Boot del repo `compapptition/api`.

> Repositorio de código del Trabajo de Fin de Grado del autor. La documentación pública de Compapptition (memoria, manual técnico, decisiones, auditorías, sistema agéntico) vive en el repo separado **[`compapptition-docs`](https://github.com/MarioNaya/compapptition-docs)**.

---

## Tabla de contenidos

- [Características](#características)
- [Stack técnico](#stack-técnico)
- [Arquitectura](#arquitectura)
- [Requisitos previos](#requisitos-previos)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [Tests](#tests)
- [Documentación generada (Compodoc)](#documentación-generada-compodoc)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Despliegue](#despliegue)
- [Contexto](#contexto)
- [Licencia](#licencia)

---

## Características

- **Stack moderno** — Angular 21.2 standalone components + signals + control flow nativo (`@if`/`@for`/`@switch`), zoneless, `LOCALE_ID = 'es'`.
- **Auth con cookie + access token** — JWT corto (15 min) en `localStorage`, refresh largo en cookie HttpOnly `Path=/auth`, **single-flight refresh** que evita race conditions cuando 5 peticiones pillan un 401 simultáneamente.
- **RBAC contextual** — guards (`auth`, `admin`, `guest`) + helpers de permisos por competición leídos del JWT. Cinco roles por competición + flag `esAdminSistema`.
- **21 services 1-a-1 con controllers backend** — capa `core/services` y servicios por feature, todos con tipado fuerte sobre los modelos compartidos `XxxSimpleDTO` / `XxxDetalleDTO`.
- **Integración SSE** — bell de notificaciones consume `/notificaciones/stream` con fallback `?token=` (dado que `EventSource` no soporta headers).
- **Mensajería 1-a-1** — bandeja + conversaciones, sincronizadas con el backend (D18).
- **Tickets de soporte in-app** — lista, creación, detalle (D37).
- **Páginas legales** — Privacidad / Aviso Legal / Términos (RGPD + LSSI).
- **Cookie banner + tour overlay** — onboarding guiado y consentimiento opcional sin librerías terceras.
- **Imágenes vía Cloudinary** — subida firmada y resize URL (D19).
- **Tema visual** — paleta naranja viva sobre fondos radiales con tokens centralizados; gradientes y *hairlines* a 1px reales.
- **Responsive móvil completo** — inputs 16px (evita zoom iOS), navbar fija con blur, hamburger, escalas con `clamp()`.

---

## Stack técnico

| Categoría | Tecnología |
|---|---|
| Framework | **Angular 21.2** (standalone, signals, zoneless) |
| Lenguaje | **TypeScript 5.9** |
| Estilos | **SCSS** modular con design system propio (tokens via variables CSS) |
| Routing | Angular Router con `loadChildren` por feature |
| Estado | **Signals** primario; RxJS solo para HTTP / SSE / streams |
| HTTP | `HttpClient` con interceptors `auth` + `error` + `refresh` |
| Calendario | `@fullcalendar/angular` 6.x (daygrid, timegrid, list, interaction) |
| Build | **`@angular/build`** (esbuild) |
| Test runner unit | **Karma 6.4** + Jasmine 6 + ChromeHeadless |
| Test runner E2E | **Playwright 1.59** + Mailpit + BD test (perfil `test` del backend) |
| Doc autogenerada | **Compodoc 1.2.1** |
| Package manager | npm 11 |

---

## Arquitectura

Carpetas por dominio bajo `src/app/`:

```
src/app/
├── core/                # transversal, sin dependencias entre features
│   ├── config/          # contact emails, feature flags
│   ├── guards/          # auth.guard, admin.guard, guest.guard
│   ├── http/            # api-error.model, pageable, with-api-retry
│   ├── interceptors/    # auth, error, refresh (single-flight)
│   ├── models/          # tipos compartidos por dominio (Simple + Detalle)
│   └── services/        # auth, image-upload, notification, tour
├── features/            # cada feature standalone con sus rutas y servicios
│   ├── admin/           # logs, sports, stat-types, users
│   ├── auth/            # login, register, forgot/reset password
│   ├── competitions/    # list, detail (6 tabs), edit, new
│   ├── dashboard/
│   ├── events/          # detail, new, calendar-wizard
│   ├── invitations/
│   ├── legal/           # privacidad, aviso-legal, términos (D38)
│   ├── matches/
│   ├── messages/        # inbox + conversation (D18)
│   ├── notifications/
│   ├── players/
│   ├── profile/
│   ├── teams/
│   └── tickets/         # lista, nuevo, detalle (D37)
├── layout/              # auth-layout, main-layout, navbar, footer
└── shared/              # ui (átomos), molecules, organisms, services, utils
```

**Path aliases activos** (ver `tsconfig.json`):

| Alias | Destino |
|---|---|
| `@core/*` | `src/app/core/*` |
| `@shared/*` | `src/app/shared/*` |
| `@layout/*` | `src/app/layout/*` |
| `@features/*` | `src/app/features/*` |
| `@env/*` | `src/environments/*` |

**Decisiones de diseño relevantes** (ver `docs/50-decisiones/decisiones.md` en el repo de docs):
- **D17** — Adopción del prototipo Claude Design + arquitectura desacoplada signals/services 1:1 con controllers backend.
- **D18** — Mensajería 1-a-1 + notificaciones SSE.
- **D19** — Imágenes URL Cloudinary (no `byte[]` BLOB).
- **D22/D23** — Refactor `GESTIONADO/ESTANDAR` → `público/privado` con `codigoInvitacion` único.
- **D40** — Sprint 6 ampliado: Tier 1+2+3 unit con threshold bloqueante + suite Playwright/Mailpit/BD test + manual técnico Compodoc.
- **D41** — Rediseño del sistema agéntico publicable (13 agentes / 10 comandos).

---

## Requisitos previos

- **Node.js 20.19+ / 22.12+ / ≥24** (lo que pide Angular 21).
- **npm 11+**.
- **Backend `compapptition/api` corriendo en `http://localhost:8080`** para desarrollo integrado (login, datos reales).
- Para los tests E2E adicionalmente:
  - **Docker Desktop** (levanta MySQL + Mailpit via `docker-compose.test.yml` del backend).
  - El backend arrancado con perfil `test` (`mvn spring-boot:run -Dspring-boot.run.profiles=test`).

---

## Configuración

Las URLs y feature flags viven en `src/environments/`:

| Fichero | Uso |
|---|---|
| `environment.ts` | Desarrollo local (`apiUrl: 'http://localhost:8080'`). |
| `environment.prod.ts` | Producción. Sustituir `apiUrl` por el dominio de la API real. |

No hay `.env` en frontend: las claves sensibles (Cloudinary cloud name, etc.) que necesita el cliente vienen del backend en runtime via `/imagenes/cloudinary-config` firmado, nunca embebido en el bundle.

**Información de contacto y emails legales** se centralizan en `src/app/core/config/contact.ts` (D38: `contacto@marionaya.com` legal/RGPD vs `no-reply@compapptition.com` operativa).

---

## Ejecución

### Servidor de desarrollo

```bash
npm start
# equivalente a: ng serve
```

Abre `http://localhost:4200/`. El servidor recarga automáticamente al modificar fuentes.

### Build de producción

```bash
npm run build
```

Artefactos en `dist/compapptition-front-web/`. La configuración `production` aplica budgets de tamaño (`500 kB` warning / `1 MB` error de bundle inicial), `outputHashing=all`, optimización completa y `sourceMap=false` (cierre SF-1).

### Build de desarrollo en watch

```bash
npm run watch
```

---

## Tests

### Unit (Karma + Jasmine) — 219 / 219

Cobertura unit con threshold bloqueante (`karma.conf.js`):

| Métrica | Threshold | Real |
|---|---:|---:|
| Statements | 80% | 84.87% |
| Branches | 60% | 62.93% |
| Functions | 78% | 81.32% |
| Lines | 80% | 86.19% |

```bash
npm test                # watch mode (desarrollo)
npm run test:ci         # single-run + ChromeHeadlessCI + cobertura
```

Cubre **45 specs** sobre guards, interceptors, services (core + por feature), componentes shared (átomos/moléculas/organismos), directives y utils. Los componentes-página (`*.page.ts`) no están testeados unitariamente porque su valor está en E2E real.

### E2E (Playwright + Mailpit + BD test) — 14 / 14 ejecutables (3 skipped)

10 flujos en `e2e/flows/` (registro/login, recuperar password, crear competición, invitar equipo, calendario, resultados, mensajería 1-a-1, ticket soporte, RBAC, vinculación de jugador). Sin mocks de capa app: la suite habla con un MySQL real (Docker) y un Mailpit que captura los emails reales que envía el backend.

```bash
npm run e2e             # ejecuta todos los flujos
npm run e2e:ui          # interactivo
npm run e2e:report      # abre el último HTML report
```

**Pre-requisitos E2E:**
1. Docker corriendo.
2. Levantar BD test + Mailpit: en el repo del backend, `docker compose -f docker-compose.test.yml up -d`.
3. Backend con perfil test: `mvn spring-boot:run -Dspring-boot.run.profiles=test`.
4. (Opcional) Frontend en `localhost:4200`. Playwright lo arranca solo si no detecta el puerto.

3 tests `skip` esperan helpers de seed de datos para 0.0.2.

---

## Documentación generada (Compodoc)

Documentación técnica HTML del frontend, equivalente a Javadoc:

```bash
npm run compodoc        # genera en documentation/
npm run compodoc:serve  # sirve en http://localhost:8080
```

**Notas:**
- Usa `tsconfig.compodoc.json` (extiende el principal, excluye `app.routes.ts` por bug del router parser de Compodoc 1.2.1 con spreads condicionales).
- Salida: `documentation/` (gitignored, ~16 MB / 287 ficheros).
- Plan de publicación: GitHub Pages del propio repo en cada release. Manual técnico narrado y enlazado desde `compapptition-docs/docs/20-manual-tecnico/`.

---

## Estructura del proyecto

```
front-web/
├── src/
│   ├── app/
│   │   ├── core/              # transversal (guards, interceptors, services, models, http)
│   │   ├── features/          # 14 features standalone con rutas lazy
│   │   ├── layout/            # navbar, footer, layouts
│   │   ├── shared/            # ui (átomos), molecules, organisms, services, directives, utils
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   └── app.ts
│   ├── environments/          # environment.ts + environment.prod.ts
│   ├── styles.scss            # entry global: tokens + animations + utilities
│   └── test.ts                # entry Karma (excluido de tsconfig.app.json)
├── e2e/
│   ├── fixtures/              # ApiHelpers, MailpitClient, UiHelpers, fixtures combinadas
│   └── flows/                 # 10 specs Playwright
├── public/
│   └── manual-usuario.html    # manual de usuario público (servido junto al SPA)
├── angular.json
├── package.json
├── playwright.config.ts
├── karma.conf.js
├── tsconfig.json
├── tsconfig.app.json          # excluye spec.ts + test.ts
├── tsconfig.spec.json         # incluye spec.ts + test.ts
└── tsconfig.compodoc.json     # excluye además app.routes.ts (bug parser)
```

---

## Despliegue

```bash
npm run build
# Subir el contenido de dist/compapptition-front-web/browser/ al hosting estático.
```

**Configuración de servidor recomendada:**
- Fallback SPA — todas las rutas a `index.html` (el router se encarga del resto).
- Headers de cache largos para `*.[hash].js|css|woff2`, cortos para `index.html`.
- HTTPS obligatorio en prod (la cookie de refresh exige `Secure`).
- Header `Strict-Transport-Security` recomendado.

Variables que **el bundle ya tiene cocidas** en build (no se pueden cambiar en runtime):
- `environment.apiUrl` — debe coincidir con el origen del backend desplegado (mismo host vía proxy reverso, o dominio explícito en CORS del backend).

---

## Contexto

Compapptition es el proyecto de **Trabajo de Fin de Grado** del autor (curso 2025-26). Tres repos:

| Repo | Contenido | Licencia |
|---|---|---|
| [`compapptition/api`](https://github.com/MarioNaya/api) | Backend Spring Boot 4.0.2 + Java 21 + MySQL | Académica |
| **`compapptition/front-web`** (este) | Frontend web Angular 21.2 + _design system_ propio en SCSS | Académica |
| [`compapptition-docs`](https://github.com/MarioNaya/compapptition-docs) | Documentación pública (memoria, manual técnico, decisiones D01-D45, auditorías, sistema agéntico) | CC BY 4.0 (docs) + MIT (plantilla agéntica) |

Para el detalle completo (arquitectura, decisiones D01-D45, auditorías de seguridad, manual técnico, estado de tests por release) consulta el repo `compapptition-docs`.

---

## Licencia

Proyecto académico. Uso personal, educativo y de evaluación permitido. Cualquier otro uso requiere contacto previo con el autor (`contacto@marionaya.com`).

---

_Última actualización: mayo 2026 · v0.0.1 · Angular 21.2 · 219 unit + 14 E2E_
