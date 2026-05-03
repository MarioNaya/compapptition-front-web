import { test, expect } from '../fixtures/test';

/**
 * E2E-2: Recuperar contraseña vía Mailpit.
 *
 * Resultado de negocio observable: tras solicitar reset, leer el email,
 * seguir el enlace y poner una contraseña nueva, el usuario puede iniciar
 * sesión con la contraseña actualizada.
 */
test.describe('Recuperar contraseña', () => {
  test('flujo completo: solicitar → email → reset → login con nueva password', async ({
    page, api, ui, mailpit,
  }) => {
    const email = api.uniqueEmail('rec');
    const username = `rec-${Date.now()}`;
    await ui.registrar({ username, email, password: 'OldPassword1' });

    // Cierra sesión y va a /auth/forgot-password.
    await page.locator('.profile-btn').click();
    await page.getByRole('menuitem', { name: /cerrar sesión/i }).click();
    await page.goto('/auth/forgot-password');

    await page.getByLabel(/email/i).fill(email);
    await page.getByRole('button', { name: /enviar|recuperar/i }).first().click();
    await expect(page.locator('.toast, .toast-host')).toContainText(/instrucciones|enviado/i);

    // Lee el email en Mailpit.
    const mail = await mailpit.waitForFirstTo(email, 15_000);
    expect(mail.Subject).toContain('Recuperación');
    const tokenMatch = (mail.HTML + mail.Text).match(/reset-password\?token=([A-Za-z0-9-]+)/);
    expect(tokenMatch?.[1]).toBeDefined();
    const token = tokenMatch![1];

    // Sigue el link de reset.
    await page.goto(`/auth/reset-password?token=${token}`);
    await page.getByLabel(/contraseña/i).first().fill('NewPassword1');
    // Confirmación si la hay.
    const confirm = page.locator('input[formcontrolname="passwordConfirm"], input[name="passwordConfirm"]');
    if (await confirm.count() > 0) await confirm.fill('NewPassword1');
    await page.getByRole('button', { name: /restablecer|cambiar/i }).first().click();

    // Login con la nueva contraseña.
    await ui.login(username, 'NewPassword1');
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });
});
