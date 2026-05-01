import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CompeticionSimple,
  EstadoCompeticion,
  MisCompeticionesPorRol,
} from '@core/models/competicion/competicion.model';
import { ApiError } from '@core/http/api-error.model';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { SearchBarComponent } from '@shared/molecules/search-bar/search-bar.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { CompetitionCardComponent } from '@shared/components/competition-card/competition-card.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { CompeticionService } from '@features/competitions/services/competicion.service';

interface FilterOption {
  readonly label: string;
  readonly value: EstadoCompeticion | 'ALL';
}

type Mode = 'mine' | 'all';
type RolKey = 'admin' | 'manager' | 'arbitro' | 'jugador';

interface CompGroup {
  readonly key: RolKey;
  readonly title: string;
  readonly items: readonly CompeticionSimple[];
}

const EMPTY_POR_ROL: MisCompeticionesPorRol = {
  admin: [],
  manager: [],
  arbitro: [],
  jugador: [],
};

@Component({
  selector: 'app-competitions-list-page',
  standalone: true,
  imports: [
    ButtonComponent,
    IconComponent,
    PageHeaderComponent,
    SearchBarComponent,
    EmptyStateComponent,
    CompetitionCardComponent,
    SpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './competitions-list.page.html',
  styleUrl: './competitions-list.page.scss',
})
export class CompetitionsListPage implements OnInit {
  private readonly service = inject(CompeticionService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  readonly loading = signal(false);
  readonly list = this.service.list;
  readonly mode = signal<Mode>('mine');
  readonly misPorRol = signal<MisCompeticionesPorRol>(EMPTY_POR_ROL);
  readonly search = signal('');
  readonly activeFilter = signal<EstadoCompeticion | 'ALL'>('ALL');

  readonly filters: readonly FilterOption[] = [
    { label: 'Todas', value: 'ALL' },
    { label: 'En curso', value: EstadoCompeticion.ACTIVA },
    { label: 'Borrador', value: EstadoCompeticion.BORRADOR },
    { label: 'Finalizada', value: EstadoCompeticion.FINALIZADA },
  ];

  /** Filtra el listado público (modo 'all') por estado. */
  readonly filteredList = computed<readonly CompeticionSimple[]>(() => {
    const filter = this.activeFilter();
    const all = this.list();
    if (filter === 'ALL') return all;
    return all.filter((c) => c.estado === filter);
  });

  /** Total de competiciones del usuario sumando los 4 roles deduplicado. */
  readonly misTotal = computed(() => {
    const por = this.misPorRol();
    const ids = new Set<number>();
    for (const c of [...por.admin, ...por.manager, ...por.arbitro, ...por.jugador]) {
      ids.add(c.id);
    }
    return ids.size;
  });

  /** Lista ordenada de los 4 grupos para render. */
  readonly compGroups = computed<readonly CompGroup[]>(() => {
    const por = this.misPorRol();
    return [
      { key: 'admin', title: 'Como administrador', items: por.admin },
      { key: 'manager', title: 'Como manager de equipo', items: por.manager },
      { key: 'arbitro', title: 'Como árbitro', items: por.arbitro },
      { key: 'jugador', title: 'Como jugador', items: por.jugador },
    ];
  });

  constructor() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((term) => {
        this.loading.set(true);
        this.service.loadList({ search: term, size: 50 });
        // El servicio gestiona su propio loading; nosotros solo lo simulamos.
        setTimeout(() => this.loading.set(false), 0);
      });
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.mode.set(params.get('mine') === '1' ? 'mine' : 'all');
      this.refresh();
    });
  }

  private refresh(): void {
    if (this.mode() === 'mine') {
      const userId = this.auth.currentUser()?.id;
      if (userId == null) return;
      this.loading.set(true);
      this.service.misCompeticionesPorRol$(userId).subscribe({
        next: (porRol) => {
          this.misPorRol.set(porRol);
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.loading.set(false);
          this.toast.error(err.message ?? 'Error al cargar tus competiciones');
        },
      });
    } else {
      this.service.loadList({ size: 50 });
    }
  }

  setMode(m: Mode): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: m === 'mine' ? { mine: 1 } : {},
    });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.searchSubject.next(value);
  }

  setFilter(value: EstadoCompeticion | 'ALL'): void {
    this.activeFilter.set(value);
  }

  openDetail(c: CompeticionSimple): void {
    this.router.navigate(['/app/competitions', c.id]);
  }

  goToNew(): void {
    this.router.navigate(['/app/competitions/new']);
  }
}
