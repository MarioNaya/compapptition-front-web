import { RolCompeticion } from '../rol';

export interface Invitacion {
  id: number;
  estado: EstadoInvitacion;
  rol: RolCompeticion;
  emisorId: number;
  emisorUsername: string;
  receptorId?: number;
  receptorUsername?: string;
  receptorEmail?: string;
  competicionId: number;
  competicionNombre: string;
  token?: string;
  fechaCreacion: string;
  fechaExpiracion?: string;
}

export enum EstadoInvitacion {
  PENDIENTE = 'PENDIENTE',
  ACEPTADA = 'ACEPTADA',
  RECHAZADA = 'RECHAZADA',
  EXPIRADA = 'EXPIRADA'
}
