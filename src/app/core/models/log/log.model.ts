export interface LogModificacion {
  id: number;
  accion: AccionLog;
  entidadTipo: string;
  entidadId: number;
  descripcion: string;
  usuarioId: number;
  usuarioUsername: string;
  competicionId?: number;
  competicionNombre?: string;
  fechaModificacion: string;
}

export enum AccionLog {
  CREAR = 'CREAR',
  EDITAR = 'EDITAR',
  ELIMINAR = 'ELIMINAR'
}
