import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Jugador } from '@core/models/equipo/jugador.model';
import { EstadisticaJugador } from '@core/models/estadistica/estadistica.model';
import { ApiError } from '@core/http/api-error.model';
import { AuthService } from '@core/services/auth.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { TeamCrestComponent } from '@shared/ui/team-crest/team-crest.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { JugadorService } from '@features/players/services/jugador.service';
import { EstadisticaService } from '@features/events/services/estadistica.service';
import { MensajeriaService } from '@features/messages/services/mensajeria.service';

interface StatSummary {
  readonly tipoId: number;
  readonly tipoNombre: string;
  readonly total: number;
  readonly count: number;
}

@Component({
  selector: 'app-player-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    TeamCrestComponent,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './player-detail.page.html',
  styleUrl: './player-detail.page.scss',
})
export class PlayerDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(JugadorService);
  private readonly statsService = inject(EstadisticaService);
  private readonly mensajeria = inject(MensajeriaService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly openingChat = signal(false);

  readonly loading = signal(true);
  readonly jugador = signal<Jugador | null>(null);
  readonly estadisticas = signal<readonly EstadisticaJugador[]>([]);

  readonly displayName = computed(() => {
    const j = this.jugador();
    if (!j) return '';
    return `${j.nombre}${j.apellidos ? ' ' + j.apellidos : ''}`;
  });

  /**
   * Solo el admin de sistema y el propio usuario vinculado al jugador pueden
   * borrar el registro completo. Para retirar a un jugador de un equipo se usa
   * el flujo "Dar de baja" que vive en el detalle del equipo.
   */
  readonly canDelete = computed(() => {
    const j = this.jugador();
    if (!j) return false;
    if (this.auth.isAdminSistema()) return true;
    const userId = this.auth.currentUser()?.id;
    return userId != null && j.usuarioId === userId;
  });

  /**
   * El botón "Enviar mensaje" sólo se muestra cuando el jugador tiene una
   * cuenta de usuario vinculada y no eres tú mismo.
   */
  readonly canMessage = computed(() => {
    const j = this.jugador();
    if (!j || j.usuarioId == null) return false;
    const userId = this.auth.currentUser()?.id;
    return userId != null && j.usuarioId !== userId;
  });

  readonly statsByType = computed<readonly StatSummary[]>(() => {
    const list = this.estadisticas();
    const map = new Map<number, StatSummary>();
    for (const s of list) {
      const current = map.get(s.tipoEstadisticaId);
      if (current) {
        map.set(s.tipoEstadisticaId, {
          ...current,
          total: current.total + s.valor,
          count: current.count + 1,
        });
      } else {
        map.set(s.tipoEstadisticaId, {
          tipoId: s.tipoEstadisticaId,
          tipoNombre: s.tipoEstadisticaNombre,
          total: s.valor,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('id'));
      if (Number.isFinite(id)) this.load(id);
    });
  }

  private load(id: number): void {
    this.loading.set(true);
    this.service.findDetalle$(id).subscribe({
      next: (j) => {
        this.jugador.set(j);
        this.loading.set(false);
        this.loadStats(id);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'Error al cargar el jugador');
        this.loading.set(false);
      },
    });
  }

  private loadStats(jugadorId: number): void {
    this.statsService.byJugador$(jugadorId).subscribe({
      next: (list) => this.estadisticas.set(list),
      error: () => this.estadisticas.set([]),
    });
  }

  async askDelete(): Promise<void> {
    const j = this.jugador();
    if (!j) return;
    const ok = await this.confirm.ask({
      title: '¿Eliminar jugador?',
      message: `${this.displayName()} y sus estadísticas serán eliminados. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    this.service.delete$(j.id).subscribe({
      next: () => {
        this.toast.success('Jugador eliminado');
        this.router.navigate(['/app/dashboard']);
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo eliminar'),
    });
  }

  /**
   * Abre (o crea) la conversación con el usuario vinculado al jugador y
   * navega al detalle de mensajería.
   */
  enviarMensaje(): void {
    const j = this.jugador();
    if (!j || j.usuarioId == null) return;
    this.openingChat.set(true);
    this.mensajeria.buscarOCrear$({ destinatarioId: j.usuarioId }).subscribe({
      next: (conv) => {
        this.openingChat.set(false);
        this.router.navigate(['/app/messages', conv.id]);
      },
      error: (err: ApiError) => {
        this.openingChat.set(false);
        this.toast.error(err.message ?? 'No se pudo abrir la conversación');
      },
    });
  }
}
