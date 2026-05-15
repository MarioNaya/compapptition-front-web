import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent, IconName } from '@shared/ui/icon/icon.component';
import { TicketService } from '@features/tickets/services/ticket.service';

interface AdminLink {
  readonly path: string;
  readonly label: string;
  readonly icon: IconName;
  /**
   * Si es `true`, el link no aplica el matching exacto del router. Se usa
   * para `Dashboard` (que vive en `/app/admin` exacto) vs el resto que son
   * sub-rutas o rutas externas al panel (p. ej. `/app/tickets`).
   */
  readonly exact?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout implements OnInit {
  private readonly ticketService = inject(TicketService);

  /** Conteo de tickets en estado ABIERTO o EN_PROCESO. Carga al montar el shell. */
  readonly ticketsPendientes = signal<number | null>(null);

  readonly links: readonly AdminLink[] = [
    { path: '/app/admin', label: 'Dashboard', icon: 'stats', exact: true },
    { path: '/app/admin/sports', label: 'Deportes', icon: 'trophy' },
    { path: '/app/admin/stat-types', label: 'Tipos estadística', icon: 'flag' },
    { path: '/app/admin/users', label: 'Usuarios', icon: 'users' },
    { path: '/app/tickets', label: 'Tickets soporte', icon: 'inbox' },
    { path: '/app/admin/logs', label: 'Logs', icon: 'book' },
  ];

  ngOnInit(): void {
    this.ticketService.contarPendientes$().subscribe({
      next: (r) => this.ticketsPendientes.set(r.pendientes),
      error: () => this.ticketsPendientes.set(null),
    });
  }
}
