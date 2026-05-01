export interface EstadisticaJugador {
  id: number;
  eventoId: number;
  jugadorId: number;
  jugadorNombre: string;
  tipoEstadisticaId: number;
  tipoEstadisticaNombre: string;
  valor: number;
  equipoId: number;
  equipoNombre: string;
}

export interface EstadisticaAcumulada {
  jugadorId: number;
  jugadorNombre: string;
  tipoEstadisticaId: number;
  tipoEstadisticaNombre: string;
  /** Suma del valor del tipo de estadística para el jugador en la competición. */
  total: number;
  competicionId?: number;
}

export interface TipoEstadistica {
  id: number;
  nombre: string;
  descripcion?: string;
  tipoValor: TipoValor;
  orden: number;
}

export enum TipoValor {
  ENTERO = 'ENTERO',
  DECIMAL = 'DECIMAL',
  BOOLEANO = 'BOOLEANO',
  TIEMPO = 'TIEMPO'
}

export interface EstadisticaCreateRequest {
  eventoId: number;
  jugadorId: number;
  tipoEstadisticaId: number;
  valor: number;
}
