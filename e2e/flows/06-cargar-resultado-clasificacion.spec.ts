import { test, expect } from '../fixtures/test';

/**
 * E2E-6: Cargar resultado de un partido y verificar que la clasificación
 * refleja el cambio.
 *
 * Resultado de negocio observable: tras cargar el resultado, la pestaña
 * "Clasificación" del detalle de competición muestra al equipo ganador
 * con 3 puntos (asumiendo formato liga 3/1/0).
 *
 * Pre-requisito: se asume que el seed test deja deportes y formatos básicos
 * pre-cargados; si no, el test es ESCAPED por falta de fixture.
 */
test.describe('Cargar resultado y clasificación', () => {
  test('manager carga resultado: clasificación refleja los puntos', async ({
    page, api, ui,
  }) => {
    // Este flujo encadena: registro admin de competición + crear competición +
    // inscribir 2 equipos del propio admin + generar calendario +
    // cargar resultado en el primer partido + ver clasificación.
    //
    // Por la cantidad de pasos y dependencia del seed real, la primera
    // ejecución suele requerir ajustes finos de selectores. Documentamos
    // el flujo y dejamos los selectores robustos posibles.

    const adminEmail = api.uniqueEmail('admclas');
    const adminUser = `admclas-${Date.now()}`;
    await ui.registrar({ username: adminUser, email: adminEmail, password: 'Password1' });

    // (Stub) — el resto del flujo se completa cuando el backend `test`
    // disponga de un endpoint /test-only/seed-competicion-con-equipos que
    // pre-cargue una competición con 2 equipos listos para jugar. Sin él,
    // este test require demasiados pasos UI para ser estable. Por ahora
    // dejamos un placeholder explícito.
    test.skip(true, 'Pendiente helper /test-only/seed-competicion-con-equipos');
  });
});
