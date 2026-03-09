export interface EventoCreateRequest {
  jornada?: number;
  fechaHora: string;
  lugar?: string;
  equipoLocalId: number;
  equipoVisitanteId: number;
  observaciones?: string;
}

export interface ResultadoRequest {
  resultadoLocal: number;
  resultadoVisitante: number;
}
