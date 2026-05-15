import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ApiError } from '@core/http/api-error.model';
import {
  ESTADOS_TICKET,
  ESTADO_TICKET_LABEL,
  EstadoTicket,
  TicketDetalle,
} from '@core/models/ticket/ticket.model';
import { TicketService } from '@features/tickets/services/ticket.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';

@Component({
  selector: 'app-tickets-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    PageHeaderComponent,
    ButtonComponent,
    SpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tickets-detail.page.html',
  styleUrl: './tickets-detail.page.scss',
})
export class TicketsDetailPage implements OnInit {
  private readonly service = inject(TicketService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly mutating = signal(false);
  readonly ticket = signal<TicketDetalle | null>(null);

  readonly estados = ESTADOS_TICKET;
  readonly labels = ESTADO_TICKET_LABEL;

  readonly isAdmin = computed(() => !!this.auth.currentUser()?.esAdminSistema);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.toast.error('Ticket no encontrado');
      this.router.navigate(['/app/tickets']);
      return;
    }
    this.cargar(id);
  }

  private cargar(id: number): void {
    this.loading.set(true);
    this.service.detalle$(id).subscribe({
      next: (t) => {
        this.ticket.set(t);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.toast.error(err.message || 'No se pudo cargar el ticket');
        this.router.navigate(['/app/tickets']);
      },
    });
  }

  cambiarEstado(estado: EstadoTicket): void {
    const t = this.ticket();
    if (!t || t.estado === estado) return;
    this.mutating.set(true);
    this.service.actualizarEstado$(t.id, { estado }).subscribe({
      next: (updated) => {
        this.ticket.set(updated);
        this.mutating.set(false);
        this.toast.success(`Estado cambiado a ${this.labels[estado]}`);
      },
      error: (err: ApiError) => {
        this.mutating.set(false);
        this.toast.error(err.message || 'No se pudo cambiar el estado');
      },
    });
  }

  /**
   * Sólo admin. Borra el ticket de forma definitiva (no soft-delete) tras
   * pedir confirmación explícita. Tras éxito redirige al listado para no
   * mostrar el detalle de un recurso ya inexistente.
   */
  async eliminar(): Promise<void> {
    const t = this.ticket();
    if (!t) return;
    const ok = await this.confirm.ask({
      title: `Eliminar ticket #${t.id}`,
      message: `Esta acción borra el ticket de "${t.usuarioUsername}" permanentemente. No se puede deshacer.`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      destructive: true,
    });
    if (!ok) return;
    this.mutating.set(true);
    this.service.eliminar$(t.id).subscribe({
      next: () => {
        this.mutating.set(false);
        this.toast.success(`Ticket #${t.id} eliminado`);
        this.router.navigate(['/app/tickets']);
      },
      error: (err: ApiError) => {
        this.mutating.set(false);
        this.toast.error(err.message || 'No se pudo eliminar el ticket');
      },
    });
  }

  estadoClass(estado: EstadoTicket): string {
    switch (estado) {
      case 'ABIERTO': return 'estado-abierto';
      case 'EN_PROCESO': return 'estado-proceso';
      case 'RESUELTO': return 'estado-resuelto';
      case 'CERRADO': return 'estado-cerrado';
    }
  }
}
