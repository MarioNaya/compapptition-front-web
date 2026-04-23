import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResponse } from '@core/models/comun/page.model';
import { Jugador, JugadorSimple } from '@core/models/equipo/jugador.model';
import { CreateJugadorRequest, UpdateJugadorRequest } from '@core/models/equipo/jugador.requests';
import { PageableRequest, toPageableParams } from '@core/http/pageable';

export interface JugadorFilters extends PageableRequest {
  readonly search?: string;
}

@Injectable({ providedIn: 'root' })
export class JugadorService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/jugadores`;

  buscar$(filters: JugadorFilters = {}): Observable<PageResponse<JugadorSimple>> {
    // El backend requiere `search` siempre (@RequestParam obligatorio). Mandamos "" si está vacío.
    const params = toPageableParams(filters, { search: filters.search ?? '' });
    return this.http.get<PageResponse<JugadorSimple>>(`${this.base}/buscar`, { params });
  }

  findSimple$(id: number): Observable<JugadorSimple> {
    return this.http.get<JugadorSimple>(`${this.base}/simple/${id}`);
  }

  findDetalle$(id: number): Observable<Jugador> {
    return this.http.get<Jugador>(`${this.base}/detalle/${id}`);
  }

  create$(req: CreateJugadorRequest): Observable<Jugador> {
    return this.http.post<Jugador>(this.base, req);
  }

  update$(id: number, req: UpdateJugadorRequest): Observable<Jugador> {
    return this.http.put<Jugador>(`${this.base}/${id}`, req);
  }

  delete$(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  vincularConUsuario$(jugadorId: number, usuarioId: number): Observable<Jugador> {
    return this.http.post<Jugador>(`${this.base}/${jugadorId}/vincular/${usuarioId}`, null);
  }
}
