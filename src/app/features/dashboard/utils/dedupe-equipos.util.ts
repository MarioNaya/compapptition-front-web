import { Equipo } from '@core/models/equipo/equipo.model';
import { EquipoConRol } from '@core/models/equipo/equipo-con-rol.model';

/**
 * Une los equipos del usuario provenientes de las tres fuentes (creador,
 * manager, jugador) deduplicando por id y etiquetando con el rol principal
 * según prioridad **Creador > Manager > Jugador**.
 *
 * Extraído como función pura para que se pueda probar de forma aislada y
 * para que el componente {@code DashboardPage} quede más limpio.
 */
export function dedupeEquipos(
  creados: readonly Equipo[],
  managers: readonly Equipo[],
  jugadores: readonly Equipo[],
): readonly EquipoConRol[] {
  const map = new Map<number, EquipoConRol>();
  for (const e of creados) map.set(e.id, { ...e, rol: 'Creador' });
  for (const e of managers) {
    if (!map.has(e.id)) map.set(e.id, { ...e, rol: 'Manager' });
  }
  for (const e of jugadores) {
    if (!map.has(e.id)) map.set(e.id, { ...e, rol: 'Jugador' });
  }
  return [...map.values()];
}
