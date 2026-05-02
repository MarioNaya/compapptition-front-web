import { Usuario } from './usuario.model';

/**
 * Respuesta del backend tras login/registro/refresh. El refresh token NO viaja
 * en este body — el backend lo emite exclusivamente en una cookie HttpOnly
 * gestionada por el navegador (cierra SF-21). El cliente solo necesita
 * persistir el {@code accessToken} y reenviar la cookie con
 * {@code withCredentials: true} en el endpoint de refresh.
 */
export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  usuario: Usuario;
}
