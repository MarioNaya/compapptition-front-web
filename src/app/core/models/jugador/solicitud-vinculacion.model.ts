export enum EstadoSolicitudVinculacion {
  PENDIENTE_USUARIO = 'PENDIENTE_USUARIO',
  PENDIENTE_ADMIN = 'PENDIENTE_ADMIN',
  ACEPTADA = 'ACEPTADA',
  RECHAZADA = 'RECHAZADA',
  EXPIRADA = 'EXPIRADA',
}

export interface SolicitudVinculacion {
  id: number;
  jugadorId: number;
  jugadorNombre: string;
  jugadorApellidos?: string;
  usuarioId: number;
  usuarioUsername?: string;
  usuarioEmail?: string;
  iniciadorId: number;
  iniciadorUsername?: string;
  equipoId: number;
  equipoNombre: string;
  estado: EstadoSolicitudVinculacion;
  fechaCreacion: string;
  fechaExpiracion: string;
  fechaResolucion?: string;
}

export interface SolicitudVinculacionAdminRequest {
  usuarioId: number;
  equipoId: number;
}

export interface SolicitudVinculacionAutoRequest {
  equipoId: number;
}
