import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Compapption end-to-end tests.
 *
 * Asume que el backend está corriendo con perfil `test` apuntando a la BD
 * `compapption_e2e` (ver `docker-compose.test.yml`) y que **Mailpit** captura
 * todos los emails salientes en `http://localhost:8025`. Los tests E2E NO
 * mockean HTTP del backend ni saltan el flujo real de autenticación: hacen
 * login real, leen emails reales de Mailpit, y verifican resultados de
 * negocio observables desde la UI.
 *
 * Uso típico:
 *
 *   # 1. Levantar backend + Mailpit + MySQL test
 *   docker compose -f docker-compose.test.yml up -d
 *   cd ../api && mvn spring-boot:run -Dspring-boot.run.profiles=test
 *
 *   # 2. Lanzar suite E2E (arranca el frontend automáticamente con webServer)
 *   npm run e2e
 *
 *   # 3. Modo interactivo (debug):
 *   npm run e2e:ui
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },

  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    locale: 'es-ES',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Arranca el frontend automáticamente. NO arranca el backend: se asume
  // que está corriendo con perfil `test`.
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
