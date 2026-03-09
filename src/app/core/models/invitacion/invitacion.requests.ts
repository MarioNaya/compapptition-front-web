import { RolCompeticion } from '../rol';

export interface CreateInvitacionRequest {
  competicionId: number;
  receptorEmail?: string;
  receptorUsername?: string;
  rol: RolCompeticion;
}
