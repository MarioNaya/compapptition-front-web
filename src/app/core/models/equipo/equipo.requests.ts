import { TipoEquipo } from './equipo.model';

export interface EquipoCreateRequest {
  nombre: string;
  descripcion?: string;
  escudoUrl?: string;
  tipo?: TipoEquipo;
}

export interface EquipoUpdateRequest {
  nombre?: string;
  descripcion?: string;
  escudoUrl?: string;
}
