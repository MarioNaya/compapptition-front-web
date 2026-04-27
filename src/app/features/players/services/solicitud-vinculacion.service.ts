import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import {
  SolicitudVinculacion,
  SolicitudVinculacionAdminRequest,
  SolicitudVinculacionAutoRequest,
} from '@core/models/jugador/solicitud-vinculacion.model';

@Injectable({ providedIn: 'root' })
export class SolicitudVinculacionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly _pendientes = signal<readonly SolicitudVinculacion[]>([]);
  readonly pendientes = this._pendientes.asReadonly();

  iniciarComoAdmin$(
    jugadorId: number,
    request: SolicitudVinculacionAdminRequest,
  ): Observable<SolicitudVinculacion> {
    return this.http.post<SolicitudVinculacion>(
      `${this.apiUrl}/jugadores/${jugadorId}/solicitudes-vinculacion`,
      request,
    );
  }

  iniciarComoUsuario$(
    jugadorId: number,
    request: SolicitudVinculacionAutoRequest,
  ): Observable<SolicitudVinculacion> {
    return this.http.post<SolicitudVinculacion>(
      `${this.apiUrl}/jugadores/${jugadorId}/solicitudes-vinculacion/auto`,
      request,
    );
  }

  aceptar$(id: number): Observable<SolicitudVinculacion> {
    return this.http.post<SolicitudVinculacion>(
      `${this.apiUrl}/solicitudes-vinculacion/${id}/aceptar`,
      null,
    );
  }

  rechazar$(id: number): Observable<SolicitudVinculacion> {
    return this.http.post<SolicitudVinculacion>(
      `${this.apiUrl}/solicitudes-vinculacion/${id}/rechazar`,
      null,
    );
  }

  pendientes$(): Observable<SolicitudVinculacion[]> {
    return this.http
      .get<SolicitudVinculacion[]>(`${this.apiUrl}/solicitudes-vinculacion/pendientes`)
      .pipe(tap((list) => this._pendientes.set(list)));
  }
}
