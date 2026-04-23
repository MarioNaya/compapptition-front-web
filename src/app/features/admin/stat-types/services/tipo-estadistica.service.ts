import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { TipoEstadistica, TipoValor } from '@core/models/estadistica/estadistica.model';

export interface TipoEstadisticaRequest {
  readonly nombre: string;
  readonly descripcion?: string;
  readonly tipoValor?: TipoValor;
  readonly orden?: number;
}

@Injectable({ providedIn: 'root' })
export class TipoEstadisticaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tipos-estadistica`;

  findByDeporte$(deporteId: number): Observable<TipoEstadistica[]> {
    return this.http.get<TipoEstadistica[]>(`${this.base}/deporte/${deporteId}`);
  }

  findById$(id: number): Observable<TipoEstadistica> {
    return this.http.get<TipoEstadistica>(`${this.base}/${id}`);
  }

  create$(deporteId: number, req: TipoEstadisticaRequest): Observable<TipoEstadistica> {
    return this.http.post<TipoEstadistica>(`${this.base}/deporte/${deporteId}`, req);
  }

  update$(id: number, req: TipoEstadisticaRequest): Observable<TipoEstadistica> {
    return this.http.put<TipoEstadistica>(`${this.base}/${id}`, req);
  }

  delete$(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
