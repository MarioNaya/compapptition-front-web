import { test, expect } from '../fixtures/test';

/**
 * E2E-4: Invitar a equipo + el destinatario acepta.
 *
 * Resultado de negocio observable: el destinatario aparece en la plantilla
 * del equipo del manager tras aceptar la invitación leída en Mailpit.
 */
test.describe('Invitación a equipo', () => {
  test('manager invita a usuario por email; al aceptar aparece en la plantilla', async ({
    page, api, ui, mailpit,
  }) => {
    // 1) Manager se registra y crea un equipo.
    const managerEmail = api.uniqueEmail('mgr');
    const managerUser = `mgr-${Date.now()}`;
    await ui.registrar({ username: managerUser, email: managerEmail, password: 'Password1' });

    await page.goto('/app/teams/new');
    const teamName = `Equipo E2E ${Date.now()}`;
    await page.getByLabel(/nombre/i).first().fill(teamName);
    // Selecciona el primer deporte si hay select.
    const deporteSelect = page.locator('select[formcontrolname="deporteId"]').first();
    if (await deporteSelect.count() > 0) {
      const opts = await deporteSelect.locator('option:not([value=""])').all();
      if (opts.length > 0) {
        const v = await opts[0].getAttribute('value');
        if (v) await deporteSelect.selectOption(v);
      }
    }
    await page.getByRole('button', { name: /crear|guardar/i }).first().click();

    // 2) Desde el detalle del equipo (o desde competiciones/admin) el manager
    //    invita por email a un destinatario nuevo.
    const inviteeEmail = api.uniqueEmail('inv');
    // Navegamos a la página de invitaciones del manager.
    await page.goto('/app/invitations');
    // Acción "Nueva invitación" — el selector exacto puede variar.
    const newInviteBtn = page.getByRole('button', { name: /nueva|invitar/i }).first();
    if (await newInviteBtn.count() > 0) await newInviteBtn.click();
    // Rellena el email del destinatario y rol "JUGADOR".
    await page.getByLabel(/email/i).first().fill(inviteeEmail);
    const rolSelect = page.locator('select[formcontrolname="rolOfrecido"], select[name="rol"]').first();
    if (await rolSelect.count() > 0) await rolSelect.selectOption('JUGADOR');
    await page.getByRole('button', { name: /enviar|invitar/i }).first().click();

    // 3) Lee el email en Mailpit y extrae el token.
    const mail = await mailpit.waitForFirstTo(inviteeEmail, 15_000);
    expect(mail.Subject).toContain('Invitación');
    const tokenMatch = (mail.HTML + mail.Text).match(/accept=([A-Za-z0-9-]+)/);
    expect(tokenMatch?.[1], 'token de invitación en email').toBeDefined();
    const token = tokenMatch![1];

    // 4) Destinatario abre el enlace, se registra y acepta.
    await page.context().clearCookies();
    await page.goto(`/app/invitations?accept=${token}`);
    // El guardia redirige a registro al no haber sesión: registramos.
    const inviteeUser = `inv-${Date.now()}`;
    await ui.registrar({ username: inviteeUser, email: inviteeEmail, password: 'Password1' });

    // 5) Auto-aceptación: tras login con accept en query, la app aplica el token.
    await page.goto(`/app/invitations?accept=${token}`);
    // Espera el toast de aceptada.
    await expect(page.locator('.toast, .toast-host')).toContainText(/aceptada|aceptaste/i);

    // 6) Manager verifica plantilla.
    await page.context().clearCookies();
    await ui.login(managerUser, 'Password1');
    await page.goto('/app/teams');
    await expect(page.locator('body')).toContainText(teamName);
    // Click sobre el equipo creado.
    await page.getByText(teamName).first().click();
    await expect(page.locator('body')).toContainText(inviteeUser);
  });
});
