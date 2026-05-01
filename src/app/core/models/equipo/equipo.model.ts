import { JugadorSimple } from './jugador.model';

export interface Equipo {
  id: number;
  nombre: string;
  descripcion?: string;
  escudoUrl?: string;
  /**
   * Visibilidad del equipo. Los públicos aparecen en el buscador al inscribir
   * en una competición; los privados sólo se invitan vía código.
   */
  publico: boolean;
  /** Código de 8 caracteres. Sólo presente cuando `publico === false`. */
  codigoInvitacion?: string | null;
  fechaCreacion: string;
  numJugadores: number;
  creadorId?: number;
  creadorUsername?: string;
  jugadores?: JugadorSimple[];
}
