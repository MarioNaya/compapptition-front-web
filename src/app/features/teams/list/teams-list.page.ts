import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, forkJoin, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Equipo } from '@core/models/equipo/equipo.model';
import { ApiError } from '@core/http/api-error.model';
import { AuthService } from '@core/services/auth.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { SearchBarComponent } from '@shared/molecules/search-bar/search-bar.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { TeamCardComponent } from '@shared/components/team-card/team-card.component';
import { ToastService } from '@shared/services/toast.service';
import { EquipoService } from '@features/teams/services/equipo.service';

type Mode = 'mine' | 'all';
type EquipoConRol = Equipo & { rol: string };

@Component({
  selector: 'app-teams-list-page',
  standalone: true,
  imports: [
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    PageHeaderComponent,
    SearchBarComponent,
    EmptyStateComponent,
    TeamCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teams-list.page.html',
  styleUrl: './teams-list.page.scss',
})
export class TeamsListPage implements OnInit {
  private readonly service = inject(EquipoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  readonly loading = signal(true);
  readonly mode = signal<Mode>('mine');
  readonly equiposPublicos = signal<readonly Equipo[]>([]);
  private readonly _equiposCreados = signal<readonly Equipo[]>([]);
  private readonly _equiposManager = signal<readonly Equipo[]>([]);
  private readonly _equiposJugador = signal<readonly Equipo[]>([]);
  readonly search = signal('');

  /**
   * Unión deduplicada de las tres fuentes de "mis equipos" (creador > manager > jugador),
   * con el rol principal embebido en cada item para mostrarlo en el card.
   */
  readonly misEquipos = computed<readonly EquipoConRol[]>(() => {
    const map = new Map<number, EquipoConRol>();
    for (const e of this._equiposCreados()) map.set(e.id, { ...e, rol: 'Creador' });
    for (const e of this._equiposManager()) {
      if (!map.has(e.id)) map.set(e.id, { ...e, rol: 'Manager' });
    }
    for (const e of this._equiposJugador()) {
      if (!map.has(e.id)) map.set(e.id, { ...e, rol: 'Jugador' });
    }
    return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  constructor() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((term) => this.loadPublicos(term));
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      // ?mine=1 → empezamos en "Mis equipos"; sin query nos vamos a explorar públicos
      this.mode.set(params.get('mine') === '1' ? 'mine' : 'all');
      this.refresh();
    });
  }

  private refresh(): void {
    if (this.mode() === 'mine') {
      this.loadMine();
    } else {
      this.loadPublicos(this.search());
    }
  }

  private loadMine(): void {
    const userId = this.auth.currentUser()?.id;
    if (userId == null) return;
    this.loading.set(true);
    forkJoin({
      creados: this.service.misEquiposCreados$(userId),
      managers: this.service.misEquiposManager$(userId),
      jugador: this.service.misEquiposJugador$(userId),
    }).subscribe({
      next: ({ creados, managers, jugador }) => {
        this._equiposCreados.set(creados);
        this._equiposManager.set(managers);
        this._equiposJugador.set(jugador);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'Error al cargar tus equipos');
        this.loading.set(false);
      },
    });
  }

  private loadPublicos(term: string): void {
    this.loading.set(true);
    this.service.findAll$({ search: term || undefined, size: 50 }).subscribe({
      next: (page) => {
        this.equiposPublicos.set(page.content);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'Error al cargar equipos');
        this.loading.set(false);
      },
    });
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

  open(e: Equipo): void {
    this.router.navigate(['/app/teams', e.id]);
  }

  goNew(): void {
    this.router.navigate(['/app/teams/new']);
  }
}
