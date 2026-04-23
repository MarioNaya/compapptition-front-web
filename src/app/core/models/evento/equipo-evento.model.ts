export interface EquipoEvento {
  id: number;
  nombre: string;
  /** Escudo del equipo en base64 (byte[] serializado por Jackson) */
  escudo?: string;
  esLocal?: boolean;
}
