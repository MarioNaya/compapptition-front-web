import { ConfiguracionCompeticion, EstadoCompeticion } from './competicion.model';

export interface CompeticionCreateRequest {
  nombre: string;
  descripcion?: string;
  deporteId: number;
  publica?: boolean;
  inscripcionAbierta?: boolean;
  estadisticasActivas?: boolean;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: EstadoCompeticion;
  configuracion?: Partial<ConfiguracionCompeticion>;
}
