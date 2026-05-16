import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { Invitacion } from '@core/models/invitacion/invitacion.model';
import type { ApiError } from '@core/http/api-error.model';
import { TabsComponent, TabOption } from '@shared/ui/tabs/tabs.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { InvitationCardComponent } from '@shared/components/invitation-card/invitation-card.component';
import { ToastService } from '@shared/services/toast.service';
import { InvitacionService } from '@features/invitations/services/invitacion.service';

type InvitationTab = 'received' | 'sent';

@Component({
  selector: 'app-invitations-page',
  standalone: true,
  imports: [TabsComponent, PageHeaderComponent, EmptyStateComponent, InvitationCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invitations.page.html',
  styleUrl: './invitations.page.scss',
})
export class InvitationsPage implements OnInit {
  private readonly service = inject(InvitacionService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly activeTab = signal<InvitationTab>('received');

  readonly tabs: readonly TabOption[] = [
    { label: 'Recibidas', value: 'received' },
    { label: 'Enviadas', value: 'sent' },
  ];

  readonly recibidas = this.service.recibidas;
  readonly enviadas = this.service.enviadas;

  readonly currentList = computed(() =>
    this.activeTab() === 'received' ? this.recibidas() : this.enviadas(),
  );

  ngOnInit(): void {
    if (this.auth.currentUser()?.id == null) return;
    this.service.loadPendientes();
    this.service.loadEnviadas();

    // Auto-aceptación al llegar desde el botón del email de invitación
    // (URL: /app/invitations?accept=<token>). Tras consumir el token se
    // limpia el query param para que un refresh no reintente aceptar.
    const acceptToken = this.route.snapshot.queryParamMap.get('accept');
    if (acceptToken) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { accept: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
      this.service.aceptar$(acceptToken).subscribe({
        next: () => {
          this.toast.success('Invitación aceptada');
          this.service.loadPendientes();
          this.auth.refreshToken().subscribe({ error: () => {} });
        },
        error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo aceptar la invitación'),
      });
    }
  }

  accept(inv: Invitacion): void {
    if (!inv.token || this.auth.currentUser()?.id == null) return;
    this.service.aceptar$(inv.token).subscribe({
      next: () => {
        this.toast.success('Invitación aceptada');
        this.service.loadPendientes();
        // Aceptar una invitación añade un rol nuevo (admin/manager/árbitro/jugador):
        // refrescamos el JWT para que el gating del frontend reconozca el rol.
        this.auth.refreshToken().subscribe({ error: () => {} });
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo aceptar'),
    });
  }

  reject(inv: Invitacion): void {
    if (!inv.token || this.auth.currentUser()?.id == null) return;
    this.service.rechazar$(inv.token).subscribe({
      next: () => {
        this.toast.success('Invitación rechazada');
        this.service.loadPendientes();
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo rechazar'),
    });
  }
}
