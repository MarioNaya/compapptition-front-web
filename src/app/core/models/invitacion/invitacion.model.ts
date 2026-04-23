import { RolCompeticion } from '../rol';

export interface Invitacion {
  id: number;
  estado: EstadoInvitacion;
  rolOfrecido: RolCompeticion;
  emisorId: number;
  emisorUsername: string;
  destinatarioId?: number;
  destinatarioUsername?: string;
  competicionId?: number;
  competicionNombre?: string;
  equipoId?: number;
  equipoNombre?: string;
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
