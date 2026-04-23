import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Usuario } from '@core/models/usuario/usuario.model';

export interface UsuarioUpdateRequest {
  readonly nombre?: string;
  readonly apellidos?: string;
  readonly email?: string;
}

export interface CambiarPasswordRequest {
  readonly passwordActual: string;
  readonly passwordNuevo: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/usuarios`;

  findById$(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.base}/${id}`);
  }

  buscarPorUsername$(username: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.base}/buscar`, { params: { username } });
  }

  update$(id: number, req: UsuarioUpdateRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.base}/${id}`, req);
  }

  cambiarPassword$(id: number, req: CambiarPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/cambiar-password`, req);
  }

  desactivar$(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
