import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { Invitacion } from '@core/models/invitacion/invitacion.model';
import { ApiError } from '@core/http/api-error.model';
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
    const userId = this.auth.currentUser()?.id;
    if (userId == null) return;
    this.service.loadPendientes(userId);
    this.service.loadEnviadas(userId);
  }

  accept(inv: Invitacion): void {
    const userId = this.auth.currentUser()?.id;
    if (!inv.token || userId == null) return;
    this.service.aceptar$(inv.token, userId).subscribe({
      next: () => {
        this.toast.success('Invitación aceptada');
        this.service.loadPendientes(userId);
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo aceptar'),
    });
  }

  reject(inv: Invitacion): void {
    const userId = this.auth.currentUser()?.id;
    if (!inv.token || userId == null) return;
    this.service.rechazar$(inv.token, userId).subscribe({
      next: () => {
        this.toast.success('Invitación rechazada');
        this.service.loadPendientes(userId);
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo rechazar'),
    });
  }
}
