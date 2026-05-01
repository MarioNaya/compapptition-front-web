import { EquipoEvento } from './equipo-evento.model';

export interface Evento {
  id: number;
  competicionId: number;
  competicionNombre: string;
  jornada?: number;
  fechaHora: string;
  lugar?: string;
  estado: EstadoEvento;
  resultadoLocal?: number;
  resultadoVisitante?: number;
  observaciones?: string;
  fechaCreacion: string;
  equipoLocal?: EquipoEvento;
  equipoVisitante?: EquipoEvento;
  // Bracket playoff — solo presentes en EventoDetalleDTO
  partidoAnteriorLocalId?: number;
  partidoAnteriorVisitanteId?: number;
  numeroPartido?: number;
  /**
   * Solo presente en EventoDetalleDTO. `true` si el partido es de playoff y la
   * fase de la que depende (liga, grupos o ronda anterior del bracket) aún no
   * ha terminado. El frontend deshabilita acciones de edición en ese caso.
   */
  bloqueado?: boolean;
}

export enum EstadoEvento {
  PROGRAMADO = 'PROGRAMADO',
  EN_CURSO = 'EN_CURSO',
  FINALIZADO = 'FINALIZADO',
  SUSPENDIDO = 'SUSPENDIDO',
  APLAZADO = 'APLAZADO'
}
