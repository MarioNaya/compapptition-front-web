/**
 * Catálogo centralizado de mensajes de UI.
 * Patrón:
 *   M.generic.genericError        // string fijo
 *   M.error('crear el equipo')    // template function
 *
 * Uso típico:
 *   this.toast.success(M.team.created);
 *   this.toast.error(err.message ?? M.error('cargar equipos'));
 */

export const M = {
  generic: {
    loading: 'Cargando…',
    saving: 'Guardando…',
    deleting: 'Eliminando…',
    genericError: 'Algo no ha funcionado. Inténtalo de nuevo.',
    noPermission: 'No tienes permisos para realizar esta acción.',
    notFound: 'No se ha encontrado lo que buscabas.',
    copied: 'Copiado al portapapeles',
  },
  auth: {
    loginError: 'Credenciales incorrectas',
    loginOther: 'No se pudo iniciar sesión',
    registered: 'Cuenta creada. ¡Bienvenido!',
    registerError: 'No se pudo completar el registro',
    sessionExpired: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
    passwordResetSent:
      'Si el email existe, recibirás instrucciones para recuperar tu contraseña.',
    passwordResetOk: 'Contraseña actualizada. Ya puedes iniciar sesión.',
    passwordResetError: 'No se pudo restablecer la contraseña',
  },
  competition: {
    created: 'Competición creada',
    updated: 'Competición actualizada',
    deleted: 'Competición eliminada',
    activated: 'Competición abierta',
    finalized: 'Competición finalizada',
    notFound: 'La competición que buscas ya no está disponible.',
  },
  team: {
    created: 'Equipo creado',
    updated: 'Equipo actualizado',
    deleted: 'Equipo eliminado',
    enrolled: 'Equipo inscrito en la competición',
    unenrolled: 'Equipo retirado de la competición',
    alreadyEnrolled: 'El equipo ya está inscrito',
  },
  player: {
    created: 'Jugador creado',
    updated: 'Jugador actualizado',
    deleted: 'Jugador eliminado',
    added: 'Jugador añadido a la plantilla',
    removed: 'Jugador retirado de la plantilla',
  },
  event: {
    created: 'Partido creado',
    updated: 'Partido actualizado',
    deleted: 'Partido eliminado',
    resultSaved: 'Resultado registrado',
    calendarGenerated: (count: number) => `Calendario generado · ${count} partidos`,
  },
  invitation: {
    sent: (target: string, teamOrRole: string) =>
      `Invitación enviada a ${target} para "${teamOrRole}"`,
    accepted: 'Invitación aceptada',
    rejected: 'Invitación rechazada',
    sendError: 'No se pudo enviar la invitación',
  },
  admin: {
    userDeactivated: 'Usuario desactivado',
    userReactivated: 'Usuario reactivado',
    sportCreated: 'Deporte creado',
    sportDeleted: 'Deporte eliminado',
    statTypeCreated: 'Tipo de estadística creado',
    statTypeDeleted: 'Tipo de estadística eliminado',
  },
  empty: {
    noCompetitions: 'Aún no participas en ninguna competición',
    noTeams: 'Aún no tienes equipos',
    noPlayers: 'Sin jugadores en la plantilla',
    noEvents: 'Sin partidos próximos',
    noStats: 'Sin estadísticas registradas',
    noInvitations: 'Sin invitaciones pendientes',
    noLogs: 'Sin registros en el histórico',
    noResults: 'No hay coincidencias',
  },
} as const;

/**
 * Template para fallback de errores.
 * Úsalo SOLO cuando no dispongas de `err.message` del backend:
 *   this.toast.error(err.message ?? M.errorDoing('cargar competiciones'));
 */
export function errorDoing(action: string): string {
  return `No se pudo ${action}`;
}
