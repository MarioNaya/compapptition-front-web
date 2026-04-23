import { RolCompeticion } from '../rol';

export interface CreateInvitacionRequest {
  /** Email del destinatario (obligatorio). */
  destinatarioEmail: string;
  /** Competición a la que se invita. */
  competicionId?: number;
  /** Equipo al que se invita (cuando el rol es MANAGER_EQUIPO o JUGADOR). */
  equipoId?: number;
  /** Rol ofrecido al aceptar la invitación. */
  rolOfrecido: RolCompeticion;
}
