import { TipoEstadistica } from '../estadistica';

export interface Deporte {
  id: number;
  nombre: string;
  descripcion?: string;
  iconoUrl?: string;
  activo: boolean;
  tiposEstadistica?: TipoEstadistica[];
}
