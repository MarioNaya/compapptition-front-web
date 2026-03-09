export interface Jugador {
  id: number;
  nombre: string;
  apellidos?: string;
  fechaNacimiento?: string;
  posicion?: string;
  dorsal?: number;
  altura?: number;
  peso?: number;
  fotoUrl?: string;
  usuarioId?: number;
  fechaCreacion: string;
}

export interface JugadorSimple {
  id: number;
  nombre: string;
  apellidos?: string;
  dorsal?: number;
  posicion?: string;
  fotoUrl?: string;
}
