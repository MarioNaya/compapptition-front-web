import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Notificacion, TipoNotificacion } from '@core/models/notificacion';
import { ApiError } from '@core/http/api-error.model';
import { NotificationService } from '@core/services/notification.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';

const TITLES: Record<TipoNotificacion, string> = {
  INVITACION_RECIBIDA: 'Nueva invitación',
  EQUIPO_ACEPTADO: 'Equipo aceptado',
  RESULTADO_REGISTRADO: 'Resultado registrado',
  MENSAJE_RECIBIDO: 'Nuevo mensaje',
  COMPETICION_ACTIVADA: 'Competición activada',
  SOLICITUD_VINCULACION_RECIBIDA: 'Solicitud de vinculación',
  SOLICITUD_VINCULACION_RESUELTA: 'Vinculación resuelta',
};

const ICONS: Record<TipoNotificacion, 'bell' | 'mail' | 'trophy' | 'users' | 'check'> = {
  INVITACION_RECIBIDA: 'bell',
  EQUIPO_ACEPTADO: 'check',
  RESULTADO_REGISTRADO: 'trophy',
  MENSAJE_RECIBIDO: 'mail',
  COMPETICION_ACTIVADA: 'trophy',
  SOLICITUD_VINCULACION_RECIBIDA: 'users',
  SOLICITUD_VINCULACION_RESUELTA: 'check',
};

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notifications.page.html',
  styleUrl: './notifications.page.scss',
})
export class NotificationsPage implements OnInit {
  private readonly service = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly items = signal<readonly Notificacion[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly totalElements = signal(0);
  readonly size = 20;

  readonly TITLES = TITLES;
  readonly ICONS = ICONS;

  ngOnInit(): void {
    this.load(0);
  }

  private load(page: number): void {
    this.loading.set(true);
    this.service.listar$(page, this.size).subscribe({
      next: (res) => {
        this.items.set(res.content);
        this.page.set(res.pageNumber);
        this.totalPages.set(res.totalPages);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.toast.error(err.message ?? 'Error al cargar notificaciones');
      },
    });
  }

  prev(): void {
    if (this.page() > 0) this.load(this.page() - 1);
  }

  next(): void {
    if (this.page() < this.totalPages() - 1) this.load(this.page() + 1);
  }

  link(n: Notificacion): readonly unknown[] | null {
    const p = (n.payload ?? {}) as Record<string, unknown>;
    switch (n.tipo) {
      case TipoNotificacion.INVITACION_RECIBIDA:
        return ['/app/invitations'];
      case TipoNotificacion.EQUIPO_ACEPTADO:
      case TipoNotificacion.COMPETICION_ACTIVADA:
        return p['competicionId'] != null ? ['/app/competitions', p['competicionId']] : null;
      case TipoNotificacion.RESULTADO_REGISTRADO:
        return p['competicionId'] != null && p['eventoId'] != null
          ? ['/app/competitions', p['competicionId'], 'events', p['eventoId']]
          : null;
      case TipoNotificacion.MENSAJE_RECIBIDO:
        return p['conversacionId'] != null ? ['/app/messages', p['conversacionId']] : ['/app/messages'];
      case TipoNotificacion.SOLICITUD_VINCULACION_RECIBIDA:
      case TipoNotificacion.SOLICITUD_VINCULACION_RESUELTA:
        return ['/app/players/vinculaciones'];
    }
    return null;
  }

  detail(n: Notificacion): string {
    const p = (n.payload ?? {}) as Record<string, unknown>;
    switch (n.tipo) {
      case TipoNotificacion.INVITACION_RECIBIDA:
        return String(p['competicionNombre'] ?? 'Tienes una invitación pendiente');
      case TipoNotificacion.EQUIPO_ACEPTADO: {
        const team = p['equipoNombre'] ?? '';
        const comp = p['competicionNombre'] ?? '';
        return `${team}${comp ? ' · ' + comp : ''}`.trim() || 'Equipo aceptado';
      }
      case TipoNotificacion.RESULTADO_REGISTRADO: {
        const local = p['localNombre'];
        const visitante = p['visitanteNombre'];
        const resultado = p['resultado'];
        if (local && visitante && resultado) return `${local} vs ${visitante} · ${resultado}`;
        if (local && visitante) return `${local} vs ${visitante}`;
        return String(resultado ?? 'Resultado registrado');
      }
      case TipoNotificacion.MENSAJE_RECIBIDO:
        return String(p['autorUsername'] ?? 'Nuevo mensaje');
      case TipoNotificacion.COMPETICION_ACTIVADA:
        return String(p['competicionNombre'] ?? 'Competición activada');
      case TipoNotificacion.SOLICITUD_VINCULACION_RECIBIDA: {
        const j = p['jugadorNombre'] ?? '';
        const e = p['equipoNombre'] ?? '';
        return `${j}${e ? ' · ' + e : ''}`.trim() || 'Solicitud pendiente';
      }
      case TipoNotificacion.SOLICITUD_VINCULACION_RESUELTA: {
        const j = p['jugadorNombre'] ?? '';
        return `${j} · ${p['aceptada'] ? 'aceptada' : 'rechazada'}`.trim();
      }
    }
    return '';
  }

  open(n: Notificacion): void {
    if (!n.leida) this.service.marcarLeida$(n.id).subscribe();
    const link = this.link(n);
    if (link) this.router.navigate([...link]);
  }

  remove(n: Notificacion, ev: Event): void {
    ev.stopPropagation();
    this.service.eliminar$(n.id).subscribe({
      next: () => {
        this.items.update((items) => items.filter((x) => x.id !== n.id));
        this.totalElements.update((t) => Math.max(0, t - 1));
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo eliminar'),
    });
  }

  markAll(): void {
    this.service.marcarTodasLeidas$().subscribe({
      next: () => {
        this.items.update((items) => items.map((n) => ({ ...n, leida: true })));
        this.toast.success('Marcadas como leídas');
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo marcar'),
    });
  }

  async clearLeidas(): Promise<void> {
    const ok = await this.confirm.ask({
      title: '¿Eliminar todas las leídas?',
      message: 'Se borrarán definitivamente las notificaciones marcadas como leídas.',
      confirmLabel: 'Eliminar leídas',
      destructive: true,
    });
    if (!ok) return;
    this.service.eliminarLeidas$().subscribe({
      next: (res) => {
        this.toast.success(`${res.eliminadas} eliminadas`);
        this.load(0);
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo limpiar'),
    });
  }
}
