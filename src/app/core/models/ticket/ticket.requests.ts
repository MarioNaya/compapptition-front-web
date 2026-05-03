import { EstadoTicket } from './ticket.model';

/**
 * Petición para crear un ticket. El autor se infiere del JWT en el backend;
 * no se envía aquí.
 */
export interface CrearTicketRequest {
  readonly asunto: string;
  readonly descripcion: string;
}

/**
 * Petición para actualizar el estado de un ticket. Reservado al admin de
 * sistema.
 */
export interface ActualizarEstadoTicketRequest {
  readonly estado: EstadoTicket;
}
