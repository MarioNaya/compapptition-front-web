import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Jugador } from '@core/models/equipo/jugador.model';
import { EstadisticaJugador } from '@core/models/estadistica/estadistica.model';
import { ApiError } from '@core/http/api-error.model';
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
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly jugador = signal<Jugador | null>(null);
  readonly estadisticas = signal<readonly EstadisticaJugador[]>([]);

  readonly displayName = computed(() => {
    const j = this.jugador();
    if (!j) return '';
    return `${j.nombre}${j.apellidos ? ' ' + j.apellidos : ''}`;
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
        this.router.navigate(['/players']);
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo eliminar'),
    });
  }
}
