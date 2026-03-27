export interface Clasificacion {
  id: number;
  competicionId: number;
  equipoId: number;
  equipoNombre: string;
  equipoEscudoUrl?: string;
  posicion: number;
  puntos: number;
  partidosJugados: number;
  victorias: number;
  empates: number;
  derrotas: number;
  golesFavor: number;
  golesContra: number;
  diferenciaGoles: number;
}
