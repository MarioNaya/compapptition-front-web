/**
 * Roles asignables a usuarios en competiciones o equipos.
 * Coincide con el enum `Rol.RolNombre` del backend.
 */
export enum RolCompeticion {
  ADMIN_SISTEMA = 'ADMIN_SISTEMA',
  ADMIN_COMPETICION = 'ADMIN_COMPETICION',
  ARBITRO = 'ARBITRO',
  MANAGER_EQUIPO = 'MANAGER_EQUIPO',
  JUGADOR = 'JUGADOR',
  INVITADO = 'INVITADO',
  /** @deprecated alias legacy, usar ARBITRO o INVITADO */
  ESPECTADOR = 'ESPECTADOR',
}
