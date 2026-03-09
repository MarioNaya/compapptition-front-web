import { TipoEstadistica } from '../estadistica';

export interface Deporte {
  id: number;
  nombre: string;
  descripcion?: string;
  icono?: string;
  activo: boolean;
  tiposEstadistica?: TipoEstadistica[];
}
