/**
 * Proyección ligera devuelta por endpoints de listado (`/publicas/simple`, `/buscar`).
 */
export interface CompeticionSimple {
  id: number;
  nombre: string;
  deporteNombre: string;
  estado: EstadoCompeticion;
}

/**
 * Entidad completa devuelta por `/{id}/detalle`.
 */
export interface Competicion {
  id: number;
  nombre: string;
  descripcion?: string;
  deporteId: number;
  deporteNombre: string;
  temporadaActual?: number;
  creadorId: number;
  creadorUsername: string;
  publica: boolean;
  inscripcionAbierta: boolean;
  estadisticasActivas: boolean;
  fechaInicio?: string;
  fechaFin?: string;
  estado: EstadoCompeticion;
  fechaCreacion: string;
  configuracion?: ConfiguracionCompeticion;
  numEquipos: number;
}

export interface ConfiguracionCompeticion {
  puntosVictoria: number;
  puntosEmpate: number;
  puntosDerrota: number;
  formato: FormatoCompeticion;
  numEquiposPlayoff: number;
  partidosEliminatoria: number;
}

export enum EstadoCompeticion {
  BORRADOR = 'BORRADOR',
  ACTIVA = 'ACTIVA',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA'
}

export enum FormatoCompeticion {
  EVENTO_UNICO = 'EVENTO_UNICO',
  LIGA = 'LIGA',
  LIGA_IDA_VUELTA = 'LIGA_IDA_VUELTA',
  PLAYOFF = 'PLAYOFF',
  LIGA_PLAYOFF = 'LIGA_PLAYOFF',
  GRUPOS_PLAYOFF = 'GRUPOS_PLAYOFF'
}
