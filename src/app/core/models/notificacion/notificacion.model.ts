export enum TipoNotificacion {
  INVITACION_RECIBIDA = 'INVITACION_RECIBIDA',
  EQUIPO_ACEPTADO = 'EQUIPO_ACEPTADO',
  RESULTADO_REGISTRADO = 'RESULTADO_REGISTRADO',
  MENSAJE_RECIBIDO = 'MENSAJE_RECIBIDO',
  COMPETICION_ACTIVADA = 'COMPETICION_ACTIVADA',
}

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  payload: Record<string, unknown>;
  leida: boolean;
  fechaCreacion: string;
}
