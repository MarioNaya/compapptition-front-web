export interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre?: string;
  apellidos?: string;
  activo: boolean;
  esAdminSistema?: boolean;
  fechaCreacion?: string;
}
