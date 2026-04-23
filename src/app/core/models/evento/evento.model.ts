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
}

export enum EstadoEvento {
  PROGRAMADO = 'PROGRAMADO',
  EN_CURSO = 'EN_CURSO',
  FINALIZADO = 'FINALIZADO',
  SUSPENDIDO = 'SUSPENDIDO',
  APLAZADO = 'APLAZADO'
}
