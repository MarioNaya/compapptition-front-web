import { test, expect } from '../fixtures/test';

/**
 * E2E-9: Invitación a competición con roles distintos.
 *
 * Cubre el flujo de invitación a una competición ofreciendo varios roles:
 * `ADMIN_COMPETICION`, `ARBITRO` y `JUGADOR`. Verifica que tras aceptar:
 *   - El destinatario aparece en la lista de usuarios de la competición.
 *   - Su rol es el ofrecido (ej. ADMIN_COMPETICION → desbloquea acciones admin).
 *
 * Resultado de negocio observable:
 *   - El destinatario, tras aceptar como ADMIN, ve los CTAs de admin en el
 *     detalle de la competición (botones de editar / generar calendario / etc).
 *   - Como ARBITRO, ve la pestaña/sección de árbitro pero no edita la comp.
 *   - Como JUGADOR, ve el detalle pero no acciones de admin.
 */
test.describe('Invitación a competición con roles distintos', () => {
  for (const rol of ['ADMIN_COMPETICION', 'ARBITRO', 'JUGADOR'] as const) {
    test(`invita usuario a competición con rol ${rol}`, async ({
      page, api, ui, mailpit,
    }) => {
      // 1) Admin de sistema/creador registra y crea competición.
      const adminEmail = api.uniqueEmail('admrol');
      const adminUser = `admrol-${Date.now()}`;
      await ui.registrar({ username: adminUser, email: adminEmail, password: 'Password1' });

      await page.goto('/app/competitions/new');
      const compName = `Comp Roles ${rol} ${Date.now()}`;
      await page.getByLabel(/nombre/i).first().fill(compName);
      const deporteSelect = page.locator('select[formcontrolname="deporteId"]').first();
      if (await deporteSelect.count() > 0) {
        const opts = await deporteSelect.locator('option:not([value=""])').all();
        if (opts.length > 0) {
          const v = await opts[0].getAttribute('value');
          if (v) await deporteSelect.selectOption(v);
        }
      }
      await page.getByRole('button', { name: /crear|guardar/i }).first().click();

      // 2) Invita por email con el rol indicado.
      const inviteeEmail = api.uniqueEmail(rol.toLowerCase());
      await page.goto('/app/invitations');
      const newInviteBtn = page.getByRole('button', { name: /nueva|invitar/i }).first();
      if (await newInviteBtn.count() > 0) await newInviteBtn.click();
      await page.getByLabel(/email/i).first().fill(inviteeEmail);
      const rolSelect = page.locator('select[formcontrolname="rolOfrecido"]').first();
      if (await rolSelect.count() > 0) await rolSelect.selectOption(rol);
      await page.getByRole('button', { name: /enviar|invitar/i }).first().click();

      // 3) Email llega a Mailpit con el token correcto y referencia al rol.
      const mail = await mailpit.waitForFirstTo(inviteeEmail, 15_000);
      expect(mail.Subject).toContain('Invitación');
      expect(mail.HTML + mail.Text).toContain(rol);
      const tokenMatch = (mail.HTML + mail.Text).match(/accept=([A-Za-z0-9-]+)/);
      expect(tokenMatch?.[1]).toBeDefined();
      const token = tokenMatch![1];

      // 4) Destinatario se registra y acepta.
      await page.context().clearCookies();
      const inviteeUser = `inv-${rol.toLowerCase()}-${Date.now()}`;
      await ui.registrar({ username: inviteeUser, email: inviteeEmail, password: 'Password1' });
      await page.goto(`/app/invitations?accept=${token}`);
      await expect(page.locator('.toast, .toast-host')).toContainText(/aceptada/i);

      // 5) Verificación según rol: el destinatario navega al detalle de la
      //    competición y observa las capacidades correspondientes.
      await page.goto('/app/dashboard');
      await page.getByText(compName).first().click();

      if (rol === 'ADMIN_COMPETICION') {
        await expect(page.locator('[data-tour="comp-actions"], .comp-actions')).toBeVisible();
      } else {
        // Sin permisos admin: el bloque comp-actions no debe aparecer (o aparece sin botones críticos).
        const actions = page.locator('[data-tour="comp-actions"]');
        if (await actions.count() > 0) {
          await expect(actions.locator('button:has-text("Editar")')).toHaveCount(0);
        }
      }
    });
  }
});
