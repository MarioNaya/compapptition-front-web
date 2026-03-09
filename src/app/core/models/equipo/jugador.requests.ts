export interface CreateJugadorRequest {
  nombre: string;
  apellidos?: string;
  fechaNacimiento?: string;
  posicion?: string;
  dorsal?: number;
  altura?: number;
  peso?: number;
  fotoUrl?: string;
}

export interface UpdateJugadorRequest {
  nombre?: string;
  apellidos?: string;
  fechaNacimiento?: string;
  posicion?: string;
  dorsal?: number;
  altura?: number;
  peso?: number;
  fotoUrl?: string;
}
