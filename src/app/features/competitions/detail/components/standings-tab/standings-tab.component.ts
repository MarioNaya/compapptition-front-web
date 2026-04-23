import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Clasificacion } from '@core/models/competicion/clasificacion.model';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { ColumnDef } from '@shared/components/data-table/data-table.types';
import { ApiError } from '@core/http/api-error.model';
import { ClasificacionService } from '@features/competitions/services/clasificacion.service';

@Component({
  selector: 'app-standings-tab',
  standalone: true,
  imports: [DataTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './standings-tab.component.html',
  styleUrl: './standings-tab.component.scss',
})
export class StandingsTabComponent implements OnInit {
  private readonly service = inject(ClasificacionService);

  readonly competicionId = input.required<number>();

  readonly loading = signal(true);
  readonly rows = signal<readonly Clasificacion[]>([]);

  readonly columns: readonly ColumnDef<Clasificacion>[] = [
    { key: 'posicion', label: '#', width: '60px', align: 'center' },
    { key: 'equipoNombre', label: 'Equipo' },
    { key: 'partidosJugados', label: 'PJ', width: '60px', align: 'center' },
    { key: 'victorias', label: 'G', width: '60px', align: 'center' },
    { key: 'empates', label: 'E', width: '60px', align: 'center' },
    { key: 'derrotas', label: 'P', width: '60px', align: 'center' },
    { key: 'golesFavor', label: 'GF', width: '60px', align: 'center' },
    { key: 'golesContra', label: 'GC', width: '60px', align: 'center' },
    { key: 'diferenciaGoles', label: '±', width: '60px', align: 'center' },
    { key: 'puntos', label: 'Pts', width: '80px', align: 'end' },
  ];

  readonly rowClass = (_row: Clasificacion, index: number, total: number): string | null => {
    if (index === 0) return 'row-leader';
    if (index === total - 1 && total > 3) return 'row-relegated';
    return null;
  };

  readonly rowKey = (r: Clasificacion) => r.id;

  ngOnInit(): void {
    this.service.findByCompeticionDetalle$(this.competicionId()).subscribe({
      next: (list) => {
        this.rows.set([...list].sort((a, b) => a.posicion - b.posicion));
        this.loading.set(false);
      },
      error: (_err: ApiError) => {
        this.loading.set(false);
      },
    });
  }
}
