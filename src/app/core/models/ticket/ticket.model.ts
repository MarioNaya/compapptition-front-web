/**
 * Estados posibles de un ticket de soporte. El backend serializa el enum
 * como su nombre (`ABIERTO`, `EN_PROCESO`, `RESUELTO`, `CERRADO`).
 */
export type EstadoTicket = 'ABIERTO' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO';

/**
 * Lista ordenada de estados utilizada para selectors (admin) y filtros.
 */
export const ESTADOS_TICKET: readonly EstadoTicket[] = [
  'ABIERTO',
  'EN_PROCESO',
  'RESUELTO',
  'CERRADO',
];

/** Etiqueta humana asociada a cada estado, en español. */
export const ESTADO_TICKET_LABEL: Readonly<Record<EstadoTicket, string>> = {
  ABIERTO: 'Abierto',
  EN_PROCESO: 'En proceso',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
};

/** Proyección ligera para listados (mis tickets, panel admin). */
export interface TicketSimple {
  readonly id: number;
  readonly usuarioId: number;
  readonly usuarioUsername: string;
  readonly asunto: string;
  readonly estado: EstadoTicket;
  readonly fechaCreacion: string;
  readonly fechaActualizacion: string;
}

/** Vista detallada de un ticket. Incluye descripción y email del autor. */
export interface TicketDetalle {
  readonly id: number;
  readonly usuarioId: number;
  readonly usuarioUsername: string;
  readonly usuarioEmail: string;
  readonly asunto: string;
  readonly descripcion: string;
  readonly estado: EstadoTicket;
  readonly fechaCreacion: string;
  readonly fechaActualizacion: string;
}
