import { test, expect } from '../fixtures/test';

/**
 * E2E-10: Invitación a equipo + verificación de vinculación user→jugador.
 *
 * El manager invita por email a un usuario para que se una al equipo como
 * jugador. Tras aceptar, se verifica:
 *   1. El usuario aparece en la plantilla del equipo.
 *   2. Existe una entidad `Jugador` con `usuarioId` igual al del invitee
 *      (vinculación realizada). Esto se observa indirectamente: en la
 *      vista del jugador de "Mis equipos", aparece este equipo, lo que
 *      sólo puede ocurrir si la vinculación se materializó en BD.
 */
test.describe('Invitación a equipo + vinculación user-jugador', () => {
  test('al aceptar invitación a equipo el usuario queda vinculado como jugador', async ({
    page, api, ui, mailpit,
  }) => {
    // 1) Manager registra y crea equipo.
    const mgrEmail = api.uniqueEmail('mgr-vin');
    const mgrUser = `mgrvin-${Date.now()}`;
    await ui.registrar({ username: mgrUser, email: mgrEmail, password: 'Password1' });

    await page.goto('/app/teams/new');
    const teamName = `Equipo Vinc ${Date.now()}`;
    await page.getByLabel(/nombre/i).first().fill(teamName);
    const deporteSelect = page.locator('select[formcontrolname="deporteId"]').first();
    if (await deporteSelect.count() > 0) {
      const opts = await deporteSelect.locator('option:not([value=""])').all();
      if (opts.length > 0) {
        const v = await opts[0].getAttribute('value');
        if (v) await deporteSelect.selectOption(v);
      }
    }
    await page.getByRole('button', { name: /crear|guardar/i }).first().click();

    // 2) Invita por email con rol JUGADOR.
    const inviteeEmail = api.uniqueEmail('jugador');
    await page.goto('/app/invitations');
    const newInviteBtn = page.getByRole('button', { name: /nueva|invitar/i }).first();
    if (await newInviteBtn.count() > 0) await newInviteBtn.click();
    await page.getByLabel(/email/i).first().fill(inviteeEmail);
    const rolSelect = page.locator('select[formcontrolname="rolOfrecido"]').first();
    if (await rolSelect.count() > 0) await rolSelect.selectOption('JUGADOR');
    await page.getByRole('button', { name: /enviar|invitar/i }).first().click();

    // 3) El destinatario lee el email y se registra.
    const mail = await mailpit.waitForFirstTo(inviteeEmail, 15_000);
    const tokenMatch = (mail.HTML + mail.Text).match(/accept=([A-Za-z0-9-]+)/);
    const token = tokenMatch![1];

    await page.context().clearCookies();
    const inviteeUser = `jug-${Date.now()}`;
    await ui.registrar({ username: inviteeUser, email: inviteeEmail, password: 'Password1' });

    // 4) Acepta la invitación → debería crear Jugador y vincularlo al usuario.
    await page.goto(`/app/invitations?accept=${token}`);
    await expect(page.locator('.toast, .toast-host')).toContainText(/aceptada/i);

    // 5) Verificación 1: el invitee ve el equipo en "Mis equipos".
    await page.goto('/app/teams');
    await expect(page.locator('body')).toContainText(teamName);

    // 6) Verificación 2: el manager abre el equipo y ve al invitee con
    //    su username en la plantilla. Esto sólo es posible si la
    //    vinculación user→jugador se materializó.
    await page.context().clearCookies();
    await ui.login(mgrUser, 'Password1');
    await page.goto('/app/teams');
    await page.getByText(teamName).first().click();
    await expect(page.locator('body')).toContainText(inviteeUser);
  });
});
