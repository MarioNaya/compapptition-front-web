export interface EquipoCreateRequest {
  nombre: string;
  descripcion?: string;
  escudoUrl?: string;
  /** Por defecto `true`. `false` genera un código de invitación en el backend. */
  publico?: boolean;
}

export interface EquipoUpdateRequest {
  nombre?: string;
  descripcion?: string;
  escudoUrl?: string;
  /**
   * Cambia visibilidad. Pasar a `false` regenera código; pasar a `true` lo
   * elimina (deja de ser válido).
   */
  publico?: boolean;
}
