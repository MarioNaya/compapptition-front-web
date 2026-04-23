import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Evento } from '@core/models/evento/evento.model';
import { EventoCreateRequest, ResultadoRequest } from '@core/models/evento/evento.requests';

@Injectable({ providedIn: 'root' })
export class EventoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/competiciones`;

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  findByCompeticion$(competicionId: number): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.base}/${competicionId}/eventos/detalle`);
  }

  findSimpleByCompeticion$(competicionId: number): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.base}/${competicionId}/eventos/simple`);
  }

  findByJornada$(competicionId: number, jornada: number): Observable<Evento[]> {
    return this.http.get<Evento[]>(
      `${this.base}/${competicionId}/eventos/jornada/${jornada}/detalle`,
    );
  }

  findByCalendario$(
    competicionId: number,
    inicio: string,
    fin: string,
  ): Observable<Evento[]> {
    const params = new HttpParams().set('inicio', inicio).set('fin', fin);
    return this.http.get<Evento[]>(
      `${this.base}/${competicionId}/eventos/calendariodetalle`,
      { params },
    );
  }

  findByEquipo$(competicionId: number, equipoId: number): Observable<Evento[]> {
    return this.http.get<Evento[]>(
      `${this.base}/${competicionId}/eventos/equipo/${equipoId}`,
    );
  }

  findById$(competicionId: number, id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.base}/${competicionId}/eventos/${id}`);
  }

  create$(competicionId: number, req: EventoCreateRequest): Observable<Evento> {
    return this.http.post<Evento>(`${this.base}/${competicionId}/eventos`, req);
  }

  update$(competicionId: number, id: number, req: EventoCreateRequest): Observable<Evento> {
    return this.http.put<Evento>(`${this.base}/${competicionId}/eventos/${id}`, req);
  }

  delete$(competicionId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${competicionId}/eventos/${id}`);
  }

  registrarResultado$(
    competicionId: number,
    id: number,
    req: ResultadoRequest,
  ): Observable<Evento> {
    return this.http.post<Evento>(
      `${this.base}/${competicionId}/eventos/${id}/resultado`,
      req,
    );
  }
}
