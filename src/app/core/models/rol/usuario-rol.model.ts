import { RolCompeticion } from './rol.model';

export interface UsuarioRolCompeticion {
  id: number;
  usuarioId: number;
  usuarioUsername: string;
  usuarioNombre?: string;
  competicionId: number;
  rol: RolCompeticion;
}
