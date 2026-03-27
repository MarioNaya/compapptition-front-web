export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegistroRequest {
  username: string;
  email: string;
  password: string;
  nombre?: string;
  apellidos?: string;
}
