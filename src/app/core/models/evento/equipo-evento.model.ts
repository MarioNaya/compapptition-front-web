export interface EquipoEvento {
  id: number;
  nombre: string;
  /** URL del escudo del equipo (string servido por backend tras migración byte[] → URL). */
  escudoUrl?: string;
  esLocal?: boolean;
}
