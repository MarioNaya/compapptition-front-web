import { MisCompeticionesPorRol } from './competicion.model';

/**
 * Estado inicial vacío para `MisCompeticionesPorRol`. Se usa como valor
 * inicial de signals en dashboard y lista "Mis competiciones" para que el
 * UI tenga shape estable antes de la primera respuesta del backend.
 * Modelo compartido para evitar duplicar la constante en cada feature
 * (cierra AF-3).
 */
export const EMPTY_POR_ROL: MisCompeticionesPorRol = {
  admin: [],
  manager: [],
  arbitro: [],
  jugador: [],
};
