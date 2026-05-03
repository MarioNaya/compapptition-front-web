import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResponse } from '@core/models/comun/page.model';
import {
  EstadoTicket,
  TicketDetalle,
  TicketSimple,
} from '@core/models/ticket/ticket.model';
import {
  ActualizarEstadoTicketRequest,
  CrearTicketRequest,
} from '@core/models/ticket/ticket.requests';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tickets`;

  crear$(req: CrearTicketRequest): Observable<TicketDetalle> {
    return this.http.post<TicketDetalle>(this.base, req);
  }

  misTickets$(page = 0, size = 20): Observable<PageResponse<TicketSimple>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<TicketSimple>>(`${this.base}/mis`, { params });
  }

  /**
   * Listado global para admin de sistema. Filtro opcional por estado.
   */
  listarTodos$(
    page = 0,
    size = 20,
    estado?: EstadoTicket,
  ): Observable<PageResponse<TicketSimple>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (estado) params = params.set('estado', estado);
    return this.http.get<PageResponse<TicketSimple>>(this.base, { params });
  }

  detalle$(id: number): Observable<TicketDetalle> {
    return this.http.get<TicketDetalle>(`${this.base}/${id}`);
  }

  contarPendientes$(): Observable<{ pendientes: number }> {
    return this.http.get<{ pendientes: number }>(`${this.base}/pendientes/count`);
  }

  actualizarEstado$(
    id: number,
    req: ActualizarEstadoTicketRequest,
  ): Observable<TicketDetalle> {
    return this.http.patch<TicketDetalle>(`${this.base}/${id}/estado`, req);
  }

  eliminar$(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
