import { test, expect } from '../fixtures/test';

/**
 * E2E-1: Registro nuevo + login + dashboard.
 *
 * Resultado de negocio observable: tras registrarse, el usuario llega al
 * dashboard y ve su nombre de usuario en el navbar.
 */
test.describe('Registro y login', () => {
  test('un usuario nuevo puede registrarse y ver el dashboard', async ({ page, api, ui }) => {
    const email = api.uniqueEmail('reg');
    const username = `e2euser-${Date.now()}`;

    await ui.registrar({
      username,
      email,
      password: 'Password1',
      nombre: 'Pepe',
    });

    // Tras el registro queda en /app/dashboard.
    await expect(page).toHaveURL(/\/app\/dashboard/);

    // El nombre de usuario aparece en el navbar (dropdown del avatar).
    await page.locator('.profile-btn').click();
    await expect(page.locator('.dropdown-header .display-name')).toContainText('Pepe');
  });

  test('login con credenciales correctas redirige al dashboard', async ({ page, api, ui }) => {
    const email = api.uniqueEmail('lg');
    const username = `lg-${Date.now()}`;
    await ui.registrar({ username, email, password: 'Password1' });

    // Cierra sesión
    await page.locator('.profile-btn').click();
    await page.getByRole('menuitem', { name: /cerrar sesión/i }).click();
    await expect(page).toHaveURL(/\/auth\/login/);

    // Re-login con username
    await ui.login(username, 'Password1');
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });

  test('login con credenciales incorrectas muestra error y NO entra', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/usuario|email/i).first().fill('inexistente');
    await page.getByLabel(/contraseña/i).fill('Mala1234');
    await page.getByRole('button', { name: /iniciar sesión|entrar/i }).click();

    // Sigue en /auth/login y aparece toast de error.
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.locator('.toast, .toast-host')).toContainText(/credenciales|incorrect/i);
  });
});
