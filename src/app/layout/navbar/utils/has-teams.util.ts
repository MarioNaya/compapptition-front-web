import { RolCompeticion } from '@core/models/rol';
import { UsuarioRolCompeticionResumen } from '@core/models/usuario';

/**
 * Decide si el link "Equipos" del navbar debe mostrarse.
 *
 * Tres caminos de inclusión:
 *   1. El usuario ha CREADO al menos un equipo (puede no tener rol todavía).
 *   2. El usuario tiene rol MANAGER_EQUIPO en alguna competición.
 *   3. El usuario tiene rol JUGADOR en alguna competición.
 *
 * Extraída a función pura para tests aislados y para reducir la huella de
 * lógica en {@code NavbarComponent}.
 */
export function tieneEquiposVisibles(
  equiposCreadosCount: number,
  rolesCompeticion: readonly UsuarioRolCompeticionResumen[] | undefined,
): boolean {
  if (equiposCreadosCount > 0) return true;
  const roles = rolesCompeticion ?? [];
  return roles.some(
    (r) => r.rol === RolCompeticion.MANAGER_EQUIPO || r.rol === RolCompeticion.JUGADOR,
  );
}
