import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { EstadisticaAcumulada, TipoEstadistica } from '@core/models/estadistica/estadistica.model';
import { ApiError } from '@core/http/api-error.model';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { ColumnDef } from '@shared/components/data-table/data-table.types';
import { ToastService } from '@shared/services/toast.service';
import { CompeticionService } from '@features/competitions/services/competicion.service';
import { EstadisticaService } from '@features/events/services/estadistica.service';
import { DeporteService } from '@features/admin/sports/services/deporte.service';

type RankingRow = EstadisticaAcumulada & { pos: number };

@Component({
  selector: 'app-stats-tab',
  standalone: true,
  imports: [SpinnerComponent, EmptyStateComponent, DataTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stats-tab.component.html',
  styleUrl: './stats-tab.component.scss',
})
export class StatsTabComponent implements OnInit {
  private readonly competicionService = inject(CompeticionService);
  private readonly deporteService = inject(DeporteService);
  private readonly statsService = inject(EstadisticaService);
  private readonly toast = inject(ToastService);

  readonly competicionId = input.required<number>();

  readonly loadingTipos = signal(false);
  readonly loadingRanking = signal(false);
  readonly tipos = signal<readonly TipoEstadistica[]>([]);
  readonly selectedTipoId = signal<number | null>(null);
  readonly ranking = signal<readonly EstadisticaAcumulada[]>([]);

  readonly columns: readonly ColumnDef<RankingRow>[] = [
    { key: 'pos', label: '#', width: '60px', align: 'center' },
    { key: 'jugadorNombre', label: 'Jugador' },
    { key: 'totalValor', label: 'Total', width: '120px', align: 'end' },
  ];

  readonly rankingWithPos = computed<readonly RankingRow[]>(() =>
    this.ranking().map((r, i) => ({ ...r, pos: i + 1 })),
  );

  readonly rowKey = (r: RankingRow) => r.jugadorId;

  readonly rowClass = (_row: RankingRow, i: number): string | null => {
    if (i === 0) return 'row-leader';
    return null;
  };

  constructor() {
    effect(() => {
      const tipoId = this.selectedTipoId();
      if (tipoId != null) this.loadRanking(tipoId);
    });
  }

  ngOnInit(): void {
    this.loadTipos();
  }

  private loadTipos(): void {
    this.loadingTipos.set(true);
    // Cargamos la competición para obtener el deporteId y luego sus tipos de estadística
    this.competicionService.findByIdDetalle$(this.competicionId()).subscribe({
      next: (c) => {
        this.deporteService.findTiposEstadistica$(c.deporteId).subscribe({
          next: (tipos) => {
            const sorted = [...tipos].sort((a, b) => a.orden - b.orden);
            this.tipos.set(sorted);
            this.loadingTipos.set(false);
            if (sorted.length > 0) this.selectedTipoId.set(sorted[0].id);
          },
          error: () => this.loadingTipos.set(false),
        });
      },
      error: () => this.loadingTipos.set(false),
    });
  }

  private loadRanking(tipoId: number): void {
    this.loadingRanking.set(true);
    this.statsService.rankingByCompeticion$(this.competicionId(), tipoId).subscribe({
      next: (list) => {
        this.ranking.set(list);
        this.loadingRanking.set(false);
      },
      error: (err: ApiError) => {
        this.loadingRanking.set(false);
        this.ranking.set([]);
        if (err.status !== 404) {
          this.toast.error(err.message ?? 'Error al cargar ranking');
        }
      },
    });
  }

  selectTipo(id: number): void {
    this.selectedTipoId.set(id);
  }
}
