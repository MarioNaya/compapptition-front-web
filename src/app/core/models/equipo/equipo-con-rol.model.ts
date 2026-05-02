import { Equipo } from './equipo.model';

/**
 * Vista de equipo enriquecida con el rol del usuario actual sobre ese equipo
 * (creador, manager, jugador). Se construye en cliente al deduplicar las
 * tres fuentes `mis-equipos/*`. Modelo compartido entre dashboard y la lista
 * "Mis equipos" para evitar duplicar el tipo en cada feature (cierra AF-3).
 */
export type EquipoConRol = Equipo & { readonly rol: string };
