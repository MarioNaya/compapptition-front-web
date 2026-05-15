# Tests E2E con Playwright

Suite de tests end-to-end **sin mocks de capa de aplicación**: el backend
real corre con perfil `test`, los emails se capturan en Mailpit, la base de
datos es una MySQL aislada que se resetea entre escenarios. Cada test
verifica un resultado de negocio observable desde la UI (no estados internos).

## Stack

- **Playwright** (`@playwright/test`).
- **Mailpit** vía Docker (SMTP local + API HTTP para leer emails).
- **MySQL 8** vía Docker (BD `compapptition_e2e`, aislada de dev).
- **Backend Spring Boot** corriendo con `--spring.profiles.active=test`.

## Pre-requisitos

- Docker Desktop (o `docker compose` en Linux).
- Java 21 + Maven en el `PATH`.
- Node 20+ + npm.
- Frontend con dependencias instaladas (`npm install` en `front-web/`).
- Browsers de Playwright instalados (`npx playwright install chromium`).

## Cómo correr la suite

Desde la raíz del repo (`compapptition/`):

```bash
# 1. Levantar Mailpit + MySQL test
docker compose -f docker-compose.test.yml up -d

# 2. Arrancar backend con perfil test (en una terminal aparte)
cd api
mvn spring-boot:run -Dspring-boot.run.profiles=test

# 3. Lanzar la suite Playwright (arranca el frontend automáticamente)
cd ../front-web
npm run e2e
```

### Modo interactivo (debug visual)

```bash
npm run e2e:ui
```

Abre el inspector de Playwright. Útil para construir tests nuevos o depurar
escenarios fallidos paso a paso.

### Ver el último report HTML

```bash
npm run e2e:report
```

## Tear down

```bash
# Para los servicios pero conserva la BD
docker compose -f docker-compose.test.yml down

# Limpia totalmente (incluye volumen MySQL)
docker compose -f docker-compose.test.yml down -v
```

## Cómo está organizado

```
e2e/
├── README.md           # este fichero
├── fixtures/
│   └── test.ts         # extiende Playwright `test` con mailpit, api, ui helpers
├── flows/
│   ├── 01-registro-login.spec.ts
│   ├── 02-recuperar-password.spec.ts
│   ├── 03-crear-competicion.spec.ts
│   ├── 04-invitar-equipo-aceptar.spec.ts
│   ├── 05-inscribir-equipo-calendario.spec.ts
│   ├── 06-cargar-resultado-clasificacion.spec.ts
│   ├── 07-mensajeria-1a1.spec.ts
│   ├── 08-ticket-soporte.spec.ts
│   ├── 09-invitar-competicion-roles.spec.ts
│   └── 10-invitar-equipo-vinculacion.spec.ts
```

## URLs de servicios mientras corre la suite

- Frontend: http://localhost:4200
- Backend API: http://localhost:8080
- Mailpit UI (lectura manual de emails): http://localhost:8025
- MySQL test: localhost:3307 (user `e2e_user` / pass `e2e_pass` / db `compapptition_e2e`)

## Filosofía

**Lo que SÍ hacen estos tests:**
- Login real con credenciales reales.
- HTTP real al backend.
- Lectura real de emails que envía el backend.
- Verificación de texto/badges/navegación visible al usuario.

**Lo que NO hacen (deliberadamente):**
- Mock del HTTP del backend (eso es trabajo de los unit tests).
- Parchear `localStorage` para fingir login.
- Verificar estado interno (signals, properties): si no es visible al usuario, no se prueba aquí.
- Tests de seguridad — los hace `security-auditor` por separado.
- Tests de rendimiento — fuera del alcance.
- Visual regression / WCAG — fuera del alcance.

## Cuándo usar el endpoint `/test-only/reset`

Cada test debería hacer `await api.resetDatabase()` (vía la fixture `api`) en
su `beforeEach` para arrancar con la BD limpia. El reset:

- Vacía todas las tablas.
- Re-crea un admin canónico: `admin-e2e` / `Admin1234`.

El endpoint sólo existe en perfil `test` y verifica además la propiedad
`app.test-mode.enabled=true`. En producción no hay handler.
