import { test, expect } from '../fixtures/test';

/**
 * E2E-7: Mensajería 1-a-1.
 *
 * Resultado de negocio observable: A envía mensaje a B; B abre la app y ve
 * el mensaje en la conversación. El badge de mensajes no leídos del navbar
 * está en > 0 antes de abrir la conversación.
 *
 * Pre-requisito de dominio: A y B deben compartir contexto (mismo equipo,
 * misma competición, o invitación pendiente). Lo más simple para un test
 * estable es que B haya invitado a A a algo, o vice versa. Lo dejamos
 * skipped por ahora, pendiente de fixture seeded.
 */
test.describe('Mensajería 1-a-1', () => {
  test('A envía mensaje a B; B ve el mensaje y el badge se actualiza', async ({
    page, api, ui,
  }) => {
    test.skip(true, 'Pendiente helper /test-only/seed-usuarios-con-contexto-compartido');
    // Esqueleto:
    // 1) Registra A y B con contexto compartido (vía seed o flujo invitación).
    // 2) Login como A → /app/messages → "nueva conversación" con B.
    // 3) Envía mensaje "Hola B".
    // 4) Logout, login como B.
    // 5) Verifica badge mail > 0 en el navbar.
    // 6) Abre la conversación, comprueba que el mensaje aparece.
    await page.goto('/');
  });
});
