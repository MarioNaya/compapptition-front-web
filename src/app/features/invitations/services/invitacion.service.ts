import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  EstadoInvitacion,
  Invitacion,
} from '@core/models/invitacion/invitacion.model';
import { CreateInvitacionRequest } from '@core/models/invitacion/invitacion.requests';

@Injectable({ providedIn: 'root' })
export class InvitacionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/invitaciones`;

  private readonly _recibidas = signal<readonly Invitacion[]>([]);
  private readonly _enviadas = signal<readonly Invitacion[]>([]);

  readonly recibidas = this._recibidas.asReadonly();
  readonly enviadas = this._enviadas.asReadonly();
  readonly pendingCount = computed(
    () => this._recibidas().filter((i) => i.estado === EstadoInvitacion.PENDIENTE).length,
  );

  findPendientes$(): Observable<Invitacion[]> {
    return this.http.get<Invitacion[]>(`${this.base}/pendientes`);
  }

  findEnviadas$(): Observable<Invitacion[]> {
    return this.http.get<Invitacion[]>(`${this.base}/enviadas`);
  }

  findByCompeticion$(competicionId: number): Observable<Invitacion[]> {
    return this.http.get<Invitacion[]>(`${this.base}/competicion/${competicionId}`);
  }

  create$(req: CreateInvitacionRequest): Observable<Invitacion> {
    // El emisor se toma del JWT en backend; no se pasa usuarioId por query.
    return this.http.post<Invitacion>(this.base, req);
  }

  aceptar$(token: string): Observable<Invitacion> {
    return this.http.put<Invitacion>(`${this.base}/${token}/aceptar`, null);
  }

  rechazar$(token: string): Observable<Invitacion> {
    return this.http.put<Invitacion>(`${this.base}/${token}/rechazar`, null);
  }

  loadPendientes(): void {
    this.findPendientes$().subscribe({
      next: (list) => this._recibidas.set(list),
    });
  }

  loadEnviadas(): void {
    this.findEnviadas$().subscribe({
      next: (list) => this._enviadas.set(list),
    });
  }
}
