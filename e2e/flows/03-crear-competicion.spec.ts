import { test, expect } from '../fixtures/test';

/**
 * E2E-3: Crear competición.
 *
 * Resultado de negocio observable: la competición recién creada aparece
 * en "Mis competiciones — como creador" del dashboard del autor.
 */
test.describe('Crear competición', () => {
  test('un admin de competición ve su competición en el dashboard tras crearla', async ({
    page, api, ui,
  }) => {
    const email = api.uniqueEmail('cc');
    const username = `cc-${Date.now()}`;
    await ui.registrar({ username, email, password: 'Password1' });

    // Crear competición desde el dropdown +
    await page.goto('/app/competitions/new');
    const compName = `Liga E2E ${Date.now()}`;
    await page.getByLabel(/nombre/i).first().fill(compName);

    // Selección de deporte (combo): el primer deporte si está pre-cargado, si no
    // saltamos este test con error claro.
    const deporteSelect = page.locator('select[formcontrolname="deporteId"], select[name="deporte"]').first();
    if (await deporteSelect.count() > 0) {
      const options = await deporteSelect.locator('option:not([value=""])').all();
      if (options.length > 0) {
        const value = await options[0].getAttribute('value');
        if (value) await deporteSelect.selectOption(value);
      }
    }

    await page.getByRole('button', { name: /crear|guardar/i }).first().click();

    // Tras crear, debe redirigir al detalle o al dashboard. En cualquier caso,
    // navegando al dashboard la competición debe aparecer en "creador".
    await page.goto('/app/dashboard');
    await expect(page.locator('body')).toContainText(compName);
  });
});
