import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { PageResponse } from '@core/models/comun/page.model';
import { Notificacion } from '@core/models/notificacion';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly base = `${environment.apiUrl}/notificaciones`;

  private readonly _items = signal<readonly Notificacion[]>([]);
  readonly items = this._items.asReadonly();
  readonly unreadCount = computed(
    () => this._items().filter((n) => !n.leida).length,
  );

  private eventSource: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private retryDelayMs = 1_500;

  constructor() {
    this.destroyRef.onDestroy(() => this.disconnect());
  }

  /**
   * Abre la conexión SSE al endpoint /notificaciones/stream.
   * Reintenta con backoff exponencial ante desconexión.
   */
  connect(): void {
    if (this.eventSource || !this.auth.isAuthenticated()) return;

    const token = this.auth.getToken();
    const url = `${this.base}/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    try {
      this.eventSource = new EventSource(url, { withCredentials: true });
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.eventSource.addEventListener('notification', (ev: MessageEvent) => {
      try {
        const n = JSON.parse(ev.data) as Notificacion;
        this.prepend(n);
      } catch {
        // payload mal formado, ignorar
      }
    });

    this.eventSource.onerror = () => {
      this.disconnect();
      this.scheduleReconnect();
    };

    this.eventSource.onopen = () => {
      this.retryDelayMs = 1_500;
    };
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (!this.auth.isAuthenticated()) return;
    if (this.reconnectTimer) return;
    const delay = Math.min(this.retryDelayMs, 30_000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.retryDelayMs *= 2;
      this.connect();
    }, delay);
  }

  listar$(page = 0, size = 10, leida?: boolean): Observable<PageResponse<Notificacion>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (leida !== undefined) params = params.set('leida', leida);
    return this.http
      .get<PageResponse<Notificacion>>(this.base, { params })
      .pipe(tap((page) => this._items.set(page.content)));
  }

  marcarLeida$(id: number): Observable<void> {
    return this.http
      .patch<void>(`${this.base}/${id}/leer`, null)
      .pipe(tap(() => this.markLocal(id, true)));
  }

  marcarTodasLeidas$(): Observable<void> {
    return this.http
      .patch<void>(`${this.base}/leer-todas`, null)
      .pipe(
        tap(() =>
          this._items.update((items) => items.map((n) => ({ ...n, leida: true }))),
        ),
      );
  }

  /**
   * Borra una notificación del servidor y de la lista local. Permite que el
   * usuario limpie individualmente entradas del dropdown de la campana.
   */
  eliminar$(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/${id}`)
      .pipe(tap(() => this._items.update((items) => items.filter((n) => n.id !== id))));
  }

  /**
   * Elimina todas las notificaciones leídas del usuario y actualiza el listado
   * local descartándolas también de memoria.
   */
  eliminarLeidas$(): Observable<{ eliminadas: number }> {
    return this.http
      .delete<{ eliminadas: number }>(`${this.base}/leidas`)
      .pipe(tap(() => this._items.update((items) => items.filter((n) => !n.leida))));
  }

  /**
   * Mantiene la lista en memoria acotada al cap del dropdown (10). Las notifs
   * antiguas siguen accesibles vía el endpoint paginado `/notificaciones`.
   */
  private static readonly DROPDOWN_CAP = 10;

  private prepend(n: Notificacion): void {
    this._items.update((items) => {
      const dedup = items.filter((x) => x.id !== n.id);
      return [n, ...dedup].slice(0, NotificationService.DROPDOWN_CAP);
    });
  }

  private markLocal(id: number, leida: boolean): void {
    this._items.update((items) =>
      items.map((n) => (n.id === id ? { ...n, leida } : n)),
    );
  }
}
