import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Deporte } from '@core/models/deporte/deporte.model';
import { TipoEstadistica } from '@core/models/estadistica/estadistica.model';

export interface DeporteRequest {
  readonly nombre: string;
  readonly descripcion?: string;
  readonly icono?: string;
  readonly activo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DeporteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/deportes`;

  private readonly _list = signal<readonly Deporte[]>([]);
  private readonly _loading = signal(false);

  readonly list = this._list.asReadonly();
  readonly loading = this._loading.asReadonly();

  findAll$(): Observable<Deporte[]> {
    return this.http.get<Deporte[]>(this.base);
  }

  findById$(id: number): Observable<Deporte> {
    return this.http.get<Deporte>(`${this.base}/${id}`);
  }

  findTiposEstadistica$(id: number): Observable<TipoEstadistica[]> {
    return this.http.get<TipoEstadistica[]>(`${this.base}/${id}/estadisticas`);
  }

  create$(req: DeporteRequest): Observable<Deporte> {
    return this.http.post<Deporte>(this.base, req);
  }

  update$(id: number, req: DeporteRequest): Observable<Deporte> {
    return this.http.put<Deporte>(`${this.base}/${id}`, req);
  }

  delete$(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  loadList(): void {
    this._loading.set(true);
    this.findAll$().subscribe({
      next: (list) => {
        this._list.set(list);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }
}
