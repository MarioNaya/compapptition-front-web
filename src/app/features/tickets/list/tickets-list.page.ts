import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ApiError } from '@core/http/api-error.model';
import {
  ESTADOS_TICKET,
  ESTADO_TICKET_LABEL,
  EstadoTicket,
  TicketSimple,
} from '@core/models/ticket/ticket.model';
import { TicketService } from '@features/tickets/services/ticket.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-tickets-list-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    PageHeaderComponent,
    EmptyStateComponent,
    ButtonComponent,
    SpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tickets-list.page.html',
  styleUrl: './tickets-list.page.scss',
})
export class TicketsListPage implements OnInit {
  private readonly service = inject(TicketService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly tickets = signal<readonly TicketSimple[]>([]);
  readonly filtroEstado = signal<EstadoTicket | ''>('');

  readonly user = this.auth.currentUser;
  readonly isAdmin = computed(() => !!this.user()?.esAdminSistema);

  readonly estados = ESTADOS_TICKET;
  readonly labels = ESTADO_TICKET_LABEL;

  ngOnInit(): void {
    this.recargar();
  }

  recargar(): void {
    this.loading.set(true);
    const obs = this.isAdmin()
      ? this.service.listarTodos$(0, 50, this.filtroEstado() || undefined)
      : this.service.misTickets$(0, 50);
    obs.subscribe({
      next: (page) => {
        this.tickets.set(page.content);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.toast.error(err.message || 'No se pudieron cargar los tickets');
      },
    });
  }

  cambiarFiltro(estado: EstadoTicket | ''): void {
    this.filtroEstado.set(estado);
    this.recargar();
  }

  irANuevo(): void {
    this.router.navigate(['/app/tickets/nuevo']);
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
