import { JugadorSimple } from './jugador.model';

export interface Equipo {
  id: number;
  nombre: string;
  descripcion?: string;
  escudoUrl?: string;
  tipo: TipoEquipo;
  fechaCreacion: string;
  numJugadores: number;
  jugadores?: JugadorSimple[];
}

export enum TipoEquipo {
  GESTIONADO = 'GESTIONADO',
  ESTANDAR = 'ESTANDAR'
}
