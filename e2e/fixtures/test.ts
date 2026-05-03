import { test as base, expect, Page } from '@playwright/test';

/**
 * Helpers de fixture comunes a todos los tests E2E. Se exponen como
 * extensión del `test` de Playwright para poder usarlos así:
 *
 *   import { test, expect } from '../fixtures/test';
 *   test('flujo X', async ({ page, mailpit, api }) => { ... });
 *
 * - `mailpit`: cliente para leer correos capturados por Mailpit.
 * - `api`: helpers para resetear estado del backend en perfil test.
 */

const MAILPIT_URL = process.env['MAILPIT_URL'] ?? 'http://localhost:8025';
const API_URL = process.env['API_URL'] ?? 'http://localhost:8080';

/**
 * Cliente mínimo de Mailpit. Documentación API:
 * https://mailpit.axllent.org/docs/api-v1/
 */
export interface MailpitClient {
  /** Borra todos los mensajes capturados (estado limpio entre tests). */
  deleteAll(): Promise<void>;
  /** Devuelve los mensajes recibidos por un destinatario, esperando hasta que llegue al menos uno. */
  waitForFirstTo(email: string, timeoutMs?: number): Promise<MailpitMessage>;
}

export interface MailpitMessage {
  ID: string;
  From: { Address: string; Name: string };
  To: ReadonlyArray<{ Address: string; Name: string }>;
  Subject: string;
  Text: string;
  HTML: string;
  Created: string;
}

function createMailpit(): MailpitClient {
  return {
    async deleteAll() {
      const resp = await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: 'DELETE' });
      if (!resp.ok) throw new Error(`Mailpit deleteAll: ${resp.status} ${resp.statusText}`);
    },

    async waitForFirstTo(email, timeoutMs = 10_000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const resp = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
        if (!resp.ok) throw new Error(`Mailpit search: ${resp.status}`);
        const data = (await resp.json()) as { messages: { ID: string }[] };
        if (data.messages.length > 0) {
          const detail = await fetch(`${MAILPIT_URL}/api/v1/message/${data.messages[0].ID}`);
          return (await detail.json()) as MailpitMessage;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      throw new Error(`Mailpit: no llegó email a ${email} en ${timeoutMs}ms`);
    },
  };
}

/**
 * Helpers contra el backend en perfil test. Endpoints `/test-only/*` deben
 * existir SOLO en perfil test (ver `application-test.properties`).
 */
export interface ApiHelpers {
  /** Vacía la BD de tests dejando sólo el admin de sistema. */
  resetDatabase(): Promise<void>;
  /** Devuelve un email único con sufijo aleatorio para evitar colisiones. */
  uniqueEmail(prefix?: string): string;
}

function createApi(): ApiHelpers {
  return {
    async resetDatabase() {
      const resp = await fetch(`${API_URL}/test-only/reset`, { method: 'POST' });
      if (!resp.ok) {
        throw new Error(
          `Backend test reset failed: ${resp.status}. ¿Está arrancado con perfil test?`,
        );
      }
    },
    uniqueEmail(prefix = 'e2e') {
      const random = Math.random().toString(36).slice(2, 8);
      return `${prefix}-${Date.now()}-${random}@compapption.test`;
    },
  };
}

/**
 * Helpers de UI compartidos entre tests (login, registro rápido, etc).
 */
export class UiHelpers {
  constructor(private readonly page: Page) {}

  async registrar(opts: {
    username: string;
    email: string;
    password: string;
    nombre?: string;
  }): Promise<void> {
    await this.page.goto('/auth/register');
    await this.page.getByLabel(/usuario/i).fill(opts.username);
    await this.page.getByLabel(/email/i).fill(opts.email);
    await this.page.getByLabel(/contraseña/i).fill(opts.password);
    if (opts.nombre) await this.page.getByLabel(/nombre/i).fill(opts.nombre);
    // Acepta el checkbox legal (B3.1).
    await this.page.locator('input[type="checkbox"][formcontrolname="aceptaLegal"]').check();
    await this.page.getByRole('button', { name: /crear cuenta/i }).click();
    await this.page.waitForURL(/\/app\/dashboard/);
  }

  async login(usernameOrEmail: string, password: string): Promise<void> {
    await this.page.goto('/auth/login');
    await this.page.getByLabel(/usuario|email/i).first().fill(usernameOrEmail);
    await this.page.getByLabel(/contraseña/i).fill(password);
    await this.page.getByRole('button', { name: /iniciar sesión|entrar/i }).click();
    await this.page.waitForURL(/\/app\/dashboard/);
  }
}

interface Fixtures {
  mailpit: MailpitClient;
  api: ApiHelpers;
  ui: UiHelpers;
}

export const test = base.extend<Fixtures>({
  mailpit: async ({}, use) => {
    const client = createMailpit();
    await client.deleteAll();
    await use(client);
  },
  api: async ({}, use) => {
    const helpers = createApi();
    await helpers.resetDatabase();
    await use(helpers);
  },
  ui: async ({ page }, use) => {
    await use(new UiHelpers(page));
  },
});

export { expect };
