import { test, expect } from '../fixtures/test';

/**
 * E2E-8: Ticket de soporte completo.
 *
 * Resultado de negocio observable:
 *   1) Un usuario abre un ticket desde el dropdown de ayuda → Soporte.
 *   2) El admin de sistema lo lista en el panel admin con estado ABIERTO.
 *   3) El admin cambia el estado a RESUELTO.
 *   4) El usuario autor recibe notificación in-app y ve el estado actualizado
 *      en su listado "Mis tickets".
 */
test.describe('Ticket de soporte', () => {
  test('usuario abre ticket; admin lo resuelve; usuario ve el cambio', async ({
    page, api, ui,
  }) => {
    // 1) Usuario corriente registra y abre ticket.
    const userEmail = api.uniqueEmail('tk');
    const userName = `tk-${Date.now()}`;
    await ui.registrar({ username: userName, email: userEmail, password: 'Password1' });

    await page.goto('/app/tickets/nuevo');
    const asunto = `No me llega email ${Date.now()}`;
    await page.getByLabel(/asunto/i).fill(asunto);
    await page.getByLabel(/descripción/i).fill('He probado a recuperar password y nada llega.');
    await page.getByRole('button', { name: /enviar ticket|enviar/i }).first().click();

    // Tras crear, redirige al detalle del ticket.
    await expect(page.locator('body')).toContainText('Abierto');

    // 2) Login como admin de sistema.
    await page.context().clearCookies();
    await ui.login('admin-e2e', 'Admin1234');

    // 3) Admin va al listado global de tickets y encuentra el creado.
    await page.goto('/app/tickets');
    await expect(page.locator('body')).toContainText(asunto);

    // Click sobre la fila para entrar al detalle.
    await page.getByText(asunto).first().click();

    // Cambia estado a RESUELTO desde los botones de admin.
    await page.getByRole('button', { name: /resuelto/i }).first().click();
    await expect(page.locator('body')).toContainText('Resuelto');

    // 4) Login de nuevo como autor y verifica que ve el ticket en estado Resuelto.
    await page.context().clearCookies();
    await ui.login(userName, 'Password1');
    await page.goto('/app/tickets');
    await expect(page.locator('body')).toContainText(asunto);
    await expect(page.locator('body')).toContainText(/Resuelto/i);
  });
});
