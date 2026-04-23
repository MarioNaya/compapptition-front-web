import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  EstadisticaAcumulada,
  EstadisticaJugador,
} from '@core/models/estadistica/estadistica.model';

@Injectable({ providedIn: 'root' })
export class EstadisticaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/estadisticas`;

  byJugador$(jugadorId: number): Observable<EstadisticaJugador[]> {
    return this.http.get<EstadisticaJugador[]>(`${this.base}/jugador/${jugadorId}`);
  }

  byJugadorTemporada$(jugadorId: number, temporada: number): Observable<EstadisticaJugador[]> {
    return this.http.get<EstadisticaJugador[]>(
      `${this.base}/jugador/${jugadorId}/temporada/${temporada}`,
    );
  }

  byEventoYJugador$(eventoId: number, jugadorId: number): Observable<EstadisticaJugador[]> {
    return this.http.get<EstadisticaJugador[]>(
      `${this.base}/jugador/${eventoId}/jugador/${jugadorId}`,
    );
  }

  byCompeticionYJugador$(competicionId: number, jugadorId: number): Observable<EstadisticaJugador[]> {
    return this.http.get<EstadisticaJugador[]>(
      `${this.base}/competicion/${competicionId}/jugador/${jugadorId}`,
    );
  }

  acumuladoByCompeticionYJugador$(
    competicionId: number,
    jugadorId: number,
  ): Observable<EstadisticaAcumulada[]> {
    return this.http.get<EstadisticaAcumulada[]>(
      `${this.base}/competicion/${competicionId}/jugador/${jugadorId}/acumulado`,
    );
  }

  rankingByCompeticion$(
    competicionId: number,
    tipoEstadisticaId: number,
  ): Observable<EstadisticaAcumulada[]> {
    return this.http.get<EstadisticaAcumulada[]>(
      `${this.base}/competicion/${competicionId}/ranking/${tipoEstadisticaId}`,
    );
  }
}
