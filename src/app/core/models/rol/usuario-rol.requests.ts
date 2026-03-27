import { RolCompeticion } from './rol.model';

export interface AsignarRolRequest {
  usuarioId: number;
  rol: RolCompeticion;
}
