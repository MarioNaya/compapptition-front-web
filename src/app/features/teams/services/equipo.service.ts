import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { PageResponse } from '@core/models/comun/page.model';
import { Equipo } from '@core/models/equipo/equipo.model';
import { EquipoCreateRequest, EquipoUpdateRequest } from '@core/models/equipo/equipo.requests';
import { Jugador } from '@core/models/equipo/jugador.model';
import { CreateJugadorRequest } from '@core/models/equipo/jugador.requests';
import { PageableRequest, toPageableParams } from '@core/http/pageable';

export interface EquipoFilters extends PageableRequest {
  readonly search?: string;
  /**
   * Si se omite, el backend devuelve solo los públicos (apto para selectores).
   * Pasar `false` incluye también privados (uso administrativo).
   */
  readonly soloPublicos?: boolean;
}

@Injectable({ providedIn: 'root' })
export class EquipoService {
  private readonly http = inject(HttpClient);
  private readonly baseApi = environment.apiUrl;
  private readonly base = `${this.baseApi}/equipos`;
  private readonly competicionesBase = `${this.baseApi}/competiciones`;

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  findAll$(filters: EquipoFilters = {}): Observable<PageResponse<Equipo>> {
    // El backend requiere `search` siempre (@RequestParam obligatorio). Mandamos "" si está vacío.
    const extras: Record<string, string> = { search: filters.search ?? '' };
    if (filters.soloPublicos === false) extras['soloPublicos'] = 'false';
    const params = toPageableParams(filters, extras);
    return this.http.get<PageResponse<Equipo>>(this.base, { params });
  }

  /**
   * Localiza un equipo privado por su código de invitación. 404 si el código
   * no existe o el equipo es público.
   */
  findByCodigo$(codigo: string): Observable<Equipo> {
    return this.http.get<Equipo>(`${this.base}/codigo/${encodeURIComponent(codigo)}`);
  }

  /** Regenera el código de invitación de un equipo privado (invalida el anterior). */
  regenerarCodigo$(equipoId: number): Observable<Equipo> {
    return this.http.post<Equipo>(`${this.base}/${equipoId}/codigo-invitacion/regenerar`, null);
  }

  findById$(id: number): Observable<Equipo> {
    return this.http.get<Equipo>(`${this.base}/${id}/detalle`);
  }

  findSimpleById$(id: number): Observable<Equipo> {
    return this.http.get<Equipo>(`${this.base}/${id}/simple`);
  }

  findByCompeticion$(competicionId: number): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(`${this.competicionesBase}/${competicionId}/equipos/detalle`);
  }

  findJugadores$(equipoId: number): Observable<Jugador[]> {
    return this.http.get<Jugador[]>(`${this.base}/${equipoId}/jugadores-detalle`);
  }

  misEquiposManager$(usuarioId: number): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(`${this.base}/mis-equipos/manager`, {
      params: { id: String(usuarioId) },
    });
  }

  misEquiposJugador$(usuarioId: number): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(`${this.base}/mis-equipos/jugador`, {
      params: { id: String(usuarioId) },
    });
  }

  misEquiposCreados$(usuarioId: number): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(`${this.base}/mis-equipos/creados`, {
      params: { id: String(usuarioId) },
    });
  }

  create$(req: EquipoCreateRequest): Observable<Equipo> {
    return this.http.post<Equipo>(this.base, req);
  }

  update$(id: number, req: EquipoUpdateRequest): Observable<Equipo> {
    return this.http.put<Equipo>(`${this.base}/${id}`, req);
  }

  delete$(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // Inscribir un equipo existente en una competición (requiere permiso admin comp)
  inscribirEnCompeticion$(
    competicionId: number,
    equipoId: number,
    usuarioId: number,
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.competicionesBase}/${competicionId}/equipos/${equipoId}`,
      null,
      { params: { usuarioId: String(usuarioId) } },
    );
  }

  retirarDeCompeticion$(
    competicionId: number,
    equipoId: number,
    usuarioId: number,
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.competicionesBase}/${competicionId}/equipos/${equipoId}`,
      { params: { usuarioId: String(usuarioId) } },
    );
  }

  agregarJugador$(equipoId: number, jugadorId: number, dorsal?: number): Observable<{ message: string }> {
    const params = dorsal !== undefined ? { dorsal: String(dorsal) } : undefined;
    return this.http.post<{ message: string }>(
      `${this.base}/${equipoId}/jugadores/${jugadorId}`,
      null,
      params ? { params } : undefined,
    );
  }

  /**
   * Crea un jugador "fantasma" (sin cuenta de usuario) y lo añade a la plantilla
   * en una sola llamada. Cualquier equipo lo soporta tras eliminar la
   * distinción GESTIONADO/ESTANDAR.
   */
  crearJugadorFantasma$(
    equipoId: number,
    request: CreateJugadorRequest,
    dorsal?: number,
  ): Observable<Jugador> {
    const params = dorsal !== undefined ? { dorsal: String(dorsal) } : undefined;
    return this.http.post<Jugador>(
      `${this.base}/${equipoId}/jugadores`,
      request,
      params ? { params } : undefined,
    );
  }

  eliminarJugador$(equipoId: number, jugadorId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${equipoId}/jugadores/${jugadorId}`);
  }

  /**
   * Actualiza el dorsal de un jugador del equipo. Si {@code dorsal} es
   * {@code null} el backend lo limpia.
   */
  actualizarDorsal$(
    equipoId: number,
    jugadorId: number,
    dorsal: number | null,
  ): Observable<{ message: string }> {
    const params = dorsal != null ? { dorsal: String(dorsal) } : undefined;
    return this.http.patch<{ message: string }>(
      `${this.base}/${equipoId}/jugadores/${jugadorId}/dorsal`,
      null,
      params ? { params } : undefined,
    );
  }
}
