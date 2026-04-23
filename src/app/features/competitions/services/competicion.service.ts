import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { PageResponse } from '@core/models/comun/page.model';
import {
  Competicion,
  CompeticionSimple,
  EstadoCompeticion,
} from '@core/models/competicion/competicion.model';
import { CompeticionCreateRequest, CompeticionUpdateRequest } from '@core/models/competicion/competicion.requests';
import { PageableRequest, toPageableParams } from '@core/http/pageable';

export interface CompeticionFilters extends PageableRequest {
  readonly search?: string;
  readonly estado?: EstadoCompeticion | null;
}

@Injectable({ providedIn: 'root' })
export class CompeticionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/competiciones`;

  // === STATE ===
  private readonly _list = signal<CompeticionSimple[]>([]);
  private readonly _totalElements = signal(0);
  private readonly _current = signal<Competicion | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly list = this._list.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly current = this._current.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly activeCount = computed(
    () => this._list().filter((c) => c.estado === EstadoCompeticion.ACTIVA).length,
  );

  // === HTTP (observables puros) ===

  findAllSimple$(filters: CompeticionFilters = {}): Observable<PageResponse<CompeticionSimple>> {
    const params = toPageableParams(filters, { search: filters.search, estado: filters.estado ?? undefined });
    const url = filters.search
      ? `${this.base}/publicas/buscar`
      : `${this.base}/publicas/simple`;
    return this.http.get<PageResponse<CompeticionSimple>>(url, { params });
  }

  findByIdDetalle$(id: number): Observable<Competicion> {
    return this.http.get<Competicion>(`${this.base}/${id}/detalle`);
  }

  findByIdSimple$(id: number): Observable<CompeticionSimple> {
    return this.http.get<CompeticionSimple>(`${this.base}/${id}/simple`);
  }

  misCreadas$(usuarioId: number): Observable<CompeticionSimple[]> {
    return this.http.get<CompeticionSimple[]>(`${this.base}/mis-competiciones/creador`, {
      params: { usuarioId: String(usuarioId) },
    });
  }

  misParticipadas$(usuarioId: number): Observable<CompeticionSimple[]> {
    return this.http.get<CompeticionSimple[]>(`${this.base}/mis-competiciones/participante`, {
      params: { usuarioId: String(usuarioId) },
    });
  }

  create$(req: CompeticionCreateRequest): Observable<Competicion> {
    return this.http.post<Competicion>(this.base, req);
  }

  update$(id: number, req: CompeticionUpdateRequest, usuarioId: number): Observable<Competicion> {
    return this.http.put<Competicion>(`${this.base}/${id}`, req, {
      params: { usuarioId: String(usuarioId) },
    });
  }

  delete$(id: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, {
      params: { usuarioId: String(usuarioId) },
    });
  }

  patchEstado$(id: number, estado: EstadoCompeticion, usuarioId: number): Observable<Competicion> {
    return this.http.patch<Competicion>(`${this.base}/${id}/estado`, null, {
      params: { estado, usuarioId: String(usuarioId) },
    });
  }

  // === FACADE (actualizan signals) ===

  loadList(filters: CompeticionFilters = {}): void {
    this._loading.set(true);
    this._error.set(null);
    this.findAllSimple$(filters).subscribe({
      next: (page) => {
        this._list.set(page.content);
        this._totalElements.set(page.totalElements);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set(err.message ?? 'Error al cargar competiciones');
        this._loading.set(false);
      },
    });
  }

  loadDetalle(id: number): void {
    this._loading.set(true);
    this._error.set(null);
    this.findByIdDetalle$(id).subscribe({
      next: (c) => {
        this._current.set(c);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set(err.message ?? 'Error al cargar competición');
        this._loading.set(false);
      },
    });
  }

  resetCurrent(): void {
    this._current.set(null);
  }
}
