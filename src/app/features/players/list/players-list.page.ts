import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JugadorSimple } from '@core/models/equipo/jugador.model';
import { ApiError } from '@core/http/api-error.model';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { SearchBarComponent } from '@shared/molecules/search-bar/search-bar.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { ColumnDef } from '@shared/components/data-table/data-table.types';
import { ToastService } from '@shared/services/toast.service';
import { JugadorService } from '@features/players/services/jugador.service';

@Component({
  selector: 'app-players-list-page',
  standalone: true,
  imports: [
    IconComponent,
    SpinnerComponent,
    PageHeaderComponent,
    SearchBarComponent,
    EmptyStateComponent,
    DataTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './players-list.page.html',
  styleUrl: './players-list.page.scss',
})
export class PlayersListPage implements OnInit {
  private readonly service = inject(JugadorService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  readonly loading = signal(true);
  readonly jugadores = signal<readonly JugadorSimple[]>([]);
  readonly search = signal('');

  readonly columns: readonly ColumnDef<JugadorSimple>[] = [
    { key: 'dorsal', label: '#', width: '70px', align: 'center', accessor: (j) => j.dorsal ?? '—' },
    {
      key: 'nombre',
      label: 'Jugador',
      accessor: (j) => `${j.nombre}${j.apellidos ? ' ' + j.apellidos : ''}`,
    },
    { key: 'posicion', label: 'Posición', width: '160px', accessor: (j) => j.posicion ?? '—' },
  ];

  readonly rowKey = (j: JugadorSimple) => j.id;

  constructor() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((term) => this.load(term));
  }

  ngOnInit(): void {
    this.load('');
  }

  private load(term: string): void {
    this.loading.set(true);
    this.service.buscar$({ search: term || undefined, size: 50 }).subscribe({
      next: (page) => {
        this.jugadores.set(page.content);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'Error al cargar jugadores');
        this.loading.set(false);
      },
    });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.searchSubject.next(value);
  }

  open(j: JugadorSimple): void {
    this.router.navigate(['/players', j.id]);
  }
}
