import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Evento } from '@core/models/evento/evento.model';
import { CalendarioGenerarRequest } from '@core/models/calendario/calendario.requests';

@Injectable({ providedIn: 'root' })
export class CalendarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/competiciones`;

  generar$(competicionId: number, req: CalendarioGenerarRequest): Observable<Evento[]> {
    return this.http.post<Evento[]>(`${this.base}/${competicionId}/calendario`, req);
  }

  generarPlayoff$(
    competicionId: number,
    req: CalendarioGenerarRequest,
    rondaInicial?: number,
  ): Observable<Evento[]> {
    const params = rondaInicial !== undefined ? { rondaInicial: String(rondaInicial) } : undefined;
    return this.http.post<Evento[]>(
      `${this.base}/${competicionId}/calendario/playoff`,
      req,
      params ? { params } : undefined,
    );
  }
}
