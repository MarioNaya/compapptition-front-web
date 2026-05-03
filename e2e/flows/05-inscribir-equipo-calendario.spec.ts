import { test, expect } from '../fixtures/test';

/**
 * E2E-5: Inscribir equipo en competición + generar calendario + ver partido.
 *
 * Resultado de negocio observable: tras inscribir 2 equipos en una
 * competición (formato liga) y generar el calendario, el primer partido
 * aparece en el detalle de la competición.
 *
 * Igual que E2E-6, este flujo encadena muchos pasos UI; lo más estable
 * sería un helper `/test-only/seed-competicion-con-equipos` en el backend
 * para reducir el coste. Lo dejamos esquemático (skipped) hasta que
 * Mario decida si añade ese helper.
 */
test.describe('Inscribir equipo + generar calendario', () => {
  test('admin genera calendario con 2 equipos inscritos y los partidos aparecen', async ({
    page, api, ui,
  }) => {
    test.skip(true, 'Pendiente helper /test-only/seed-competicion-con-equipos');
    // Esqueleto del flujo (referencia):
    // 1) Admin crea competición liga.
    // 2) Admin crea 2 equipos.
    // 3) Inscribe ambos en la competición.
    // 4) Genera calendario.
    // 5) Verifica que la pestaña "Calendario" muestra al menos 1 partido.
    await page.goto('/');
  });
});
