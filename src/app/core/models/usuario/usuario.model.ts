import { RolCompeticion } from '../rol/rol.model';

export interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre?: string;
  apellidos?: string;
  activo: boolean;
  esAdminSistema?: boolean;
  fechaCreacion?: string;
  /**
   * Roles del usuario por competición. Se rellena al hacer login (desde el
   * claim `competiciones` del JWT). Permite gating RBAC en el cliente sin
   * llamar al backend.
   */
  rolesCompeticion?: readonly UsuarioRolCompeticionResumen[];
}

export interface UsuarioRolCompeticionResumen {
  id: number;
  nombre: string;
  rol: RolCompeticion;
}
