import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { PageResponse } from '@core/models/comun/page.model';
import {
  ConversacionSimple,
  ConversacionStartRequest,
  Mensaje,
  MensajeCreateRequest,
} from '@core/models/mensaje';

@Injectable({ providedIn: 'root' })
export class MensajeriaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/conversaciones`;

  private readonly _conversaciones = signal<readonly ConversacionSimple[]>([]);
  readonly conversaciones = this._conversaciones.asReadonly();

  readonly unreadTotal = computed(() =>
    this._conversaciones().reduce((acc, c) => acc + (c.unreadCount ?? 0), 0),
  );

  listar$(): Observable<ConversacionSimple[]> {
    return this.http
      .get<ConversacionSimple[]>(this.base)
      .pipe(tap((list) => this._conversaciones.set(list)));
  }

  mensajes$(conversacionId: number, page = 0, size = 50): Observable<PageResponse<Mensaje>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Mensaje>>(`${this.base}/${conversacionId}/mensajes`, { params });
  }

  buscarOCrear$(req: ConversacionStartRequest): Observable<ConversacionSimple> {
    return this.http.post<ConversacionSimple>(this.base, req);
  }

  enviar$(conversacionId: number, req: MensajeCreateRequest): Observable<Mensaje> {
    return this.http.post<Mensaje>(`${this.base}/${conversacionId}/mensajes`, req);
  }

  marcarLeido$(conversacionId: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/${conversacionId}/leer`, null);
  }

  /** Polling helper para refrescar la lista de conversaciones. */
  refresh(): void {
    this.listar$().subscribe();
  }
}
