import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Notificacion } from '@core/models/notificacion';
import { ApiError } from '@core/http/api-error.model';
import { NotificationService } from '@core/services/notification.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import {
  NOTIFICATION_ICONS,
  NOTIFICATION_TITLES,
  notificationDetail,
  notificationLink,
} from '@shared/utils/notification-mapper.util';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [
    DatePipe,
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

  // Expuestos al template; mappers compartidos en shared/utils (cierra AF-4).
  readonly TITLES = NOTIFICATION_TITLES;
  readonly ICONS = NOTIFICATION_ICONS;

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

  // Expuestos como métodos de instancia para que el template pueda llamar
  // sin importar funciones top-level. Delegan al util compartido (AF-4).
  link(n: Notificacion): readonly unknown[] | null {
    return notificationLink(n);
  }

  detail(n: Notificacion): string {
    return notificationDetail(n);
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
