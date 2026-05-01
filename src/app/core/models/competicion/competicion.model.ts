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
  /** Solo relevante si formato === GRUPOS_PLAYOFF. null = auto-calcular. */
  numGrupos?: number | null;
}

/**
 * Agrupa las competiciones del usuario por el rol con el que participa.
 * Una misma competición puede aparecer en más de una lista (p.ej. admin que
 * además es jugador de un equipo inscrito).
 */
export interface MisCompeticionesPorRol {
  admin: CompeticionSimple[];
  manager: CompeticionSimple[];
  arbitro: CompeticionSimple[];
  jugador: CompeticionSimple[];
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
