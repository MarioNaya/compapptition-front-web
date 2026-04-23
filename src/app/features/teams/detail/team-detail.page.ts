import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, forkJoin, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Equipo } from '@core/models/equipo/equipo.model';
import { Jugador, JugadorSimple } from '@core/models/equipo/jugador.model';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { TeamCrestComponent } from '@shared/ui/team-crest/team-crest.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { SearchBarComponent } from '@shared/molecules/search-bar/search-bar.component';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { ColumnDef } from '@shared/components/data-table/data-table.types';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { EquipoService } from '@features/teams/services/equipo.service';
import { JugadorService } from '@features/players/services/jugador.service';

@Component({
  selector: 'app-team-detail-page',
  standalone: true,
  imports: [
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    TeamCrestComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    SearchBarComponent,
    DataTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-detail.page.html',
  styleUrl: './team-detail.page.scss',
})
export class TeamDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(EquipoService);
  private readonly jugadorService = inject(JugadorService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly equipo = signal<Equipo | null>(null);
  readonly jugadores = signal<readonly Jugador[]>([]);

  // Panel de añadir jugador
  readonly showAdd = signal(false);
  readonly search = signal('');
  readonly searching = signal(false);
  readonly results = signal<readonly JugadorSimple[]>([]);
  readonly selected = signal<JugadorSimple | null>(null);
  readonly dorsal = signal<number | null>(null);
  readonly adding = signal(false);

  private readonly searchSubject = new Subject<string>();

  readonly columns: readonly ColumnDef<Jugador>[] = [
    {
      key: 'dorsal',
      label: '#',
      width: '70px',
      align: 'center',
      accessor: (j) => j.dorsal ?? '—',
    },
    {
      key: 'nombre',
      label: 'Jugador',
      accessor: (j) => `${j.nombre}${j.apellidos ? ' ' + j.apellidos : ''}`,
    },
    { key: 'posicion', label: 'Posición', width: '140px' },
    { key: 'altura', label: 'Altura', width: '100px', align: 'center' },
    { key: 'peso', label: 'Peso', width: '100px', align: 'center' },
  ];

  readonly rowKey = (j: Jugador) => j.id;

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          this.searching.set(true);
          return this.jugadorService.buscar$({ search: term, size: 20 });
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (page) => {
          const enrolledIds = new Set(this.jugadores().map((j) => j.id));
          this.results.set(page.content.filter((j) => !enrolledIds.has(j.id)));
          this.searching.set(false);
        },
        error: () => {
          this.results.set([]);
          this.searching.set(false);
        },
      });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('id'));
      if (Number.isFinite(id)) this.load(id);
    });
  }

  private load(id: number): void {
    this.loading.set(true);
    forkJoin({
      equipo: this.service.findById$(id),
      jugadores: this.service.findJugadores$(id),
    }).subscribe({
      next: ({ equipo, jugadores }) => {
        this.equipo.set(equipo);
        this.jugadores.set(jugadores);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'Error al cargar el equipo');
        this.loading.set(false);
      },
    });
  }

  openJugador(j: Jugador): void {
    this.router.navigate(['/app/players', j.id]);
  }

  goEdit(): void {
    const e = this.equipo();
    if (!e) return;
    this.router.navigate(['/app/teams', e.id, 'edit']);
  }

  toggleAdd(): void {
    this.showAdd.update((v) => !v);
    if (this.showAdd()) {
      this.search.set('');
      this.selected.set(null);
      this.dorsal.set(null);
      this.searchSubject.next('');
    }
  }

  onSearchChange(v: string): void {
    this.search.set(v);
    this.searchSubject.next(v);
  }

  selectPlayer(j: JugadorSimple): void {
    this.selected.set(j);
    this.dorsal.set(null);
  }

  backToSearch(): void {
    this.selected.set(null);
    this.dorsal.set(null);
  }

  onDorsalChange(v: string): void {
    const n = Number(v);
    this.dorsal.set(Number.isFinite(n) && n > 0 ? n : null);
  }

  addPlayer(): void {
    const e = this.equipo();
    const j = this.selected();
    if (!e || !j) return;
    const d = this.dorsal();
    this.adding.set(true);
    this.service.agregarJugador$(e.id, j.id, d ?? undefined).subscribe({
      next: () => {
        this.toast.success(`${j.nombre} añadido a la plantilla`);
        this.adding.set(false);
        this.showAdd.set(false);
        this.load(e.id);
      },
      error: (err: ApiError) => {
        this.adding.set(false);
        this.toast.error(err.message ?? 'No se pudo añadir');
      },
    });
  }

  async askDelete(): Promise<void> {
    const e = this.equipo();
    if (!e) return;
    const ok = await this.confirm.ask({
      title: '¿Eliminar equipo?',
      message: `"${e.nombre}" se eliminará junto con sus jugadores. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    this.service.delete$(e.id).subscribe({
      next: () => {
        this.toast.success('Equipo eliminado');
        this.router.navigate(['/app/dashboard']);
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo eliminar'),
    });
  }
}
