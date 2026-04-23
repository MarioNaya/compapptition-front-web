import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/services/auth.service';
import { EstadoCompeticion, FormatoCompeticion } from '@core/models/competicion/competicion.model';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { TabsComponent, TabOption } from '@shared/ui/tabs/tabs.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { StatusTagComponent } from '@shared/molecules/status-tag/status-tag.component';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { CompeticionService } from '@features/competitions/services/competicion.service';
import { MatchesTabComponent } from './components/matches-tab/matches-tab.component';
import { StandingsTabComponent } from './components/standings-tab/standings-tab.component';
import { TeamsTabComponent } from './components/teams-tab/teams-tab.component';
import { StatsTabComponent } from './components/stats-tab/stats-tab.component';
import { BracketTabComponent } from './components/bracket-tab/bracket-tab.component';

type DetailTab = 'matches' | 'standings' | 'teams' | 'stats' | 'bracket';

const PLAYOFF_FORMATS = new Set<FormatoCompeticion>([
  FormatoCompeticion.PLAYOFF,
  FormatoCompeticion.LIGA_PLAYOFF,
  FormatoCompeticion.GRUPOS_PLAYOFF,
]);

@Component({
  selector: 'app-competition-detail-page',
  standalone: true,
  imports: [
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    TabsComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    StatusTagComponent,
    MatchesTabComponent,
    StandingsTabComponent,
    TeamsTabComponent,
    StatsTabComponent,
    BracketTabComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './competition-detail.page.html',
  styleUrl: './competition-detail.page.scss',
})
export class CompetitionDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(CompeticionService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly competicion = this.service.current;
  readonly loading = this.service.loading;
  readonly activeTab = signal<DetailTab>('matches');

  readonly EstadoCompeticion = EstadoCompeticion;

  readonly hasBracket = computed(() => {
    const formato = this.competicion()?.configuracion?.formato;
    return !!formato && PLAYOFF_FORMATS.has(formato);
  });

  readonly tabs = computed<readonly TabOption[]>(() => {
    const base: TabOption[] = [
      { label: 'Partidos', value: 'matches' },
      { label: 'Clasificación', value: 'standings' },
      { label: 'Equipos', value: 'teams' },
      { label: 'Estadísticas', value: 'stats' },
    ];
    if (this.hasBracket()) {
      base.splice(2, 0, { label: 'Cuadro', value: 'bracket' });
    }
    return base;
  });

  readonly canManage = computed(() => {
    const user = this.auth.currentUser();
    const c = this.competicion();
    return !!user && !!c && c.creadorId === user.id;
  });

  readonly canActivate = computed(
    () => this.canManage() && this.competicion()?.estado === EstadoCompeticion.BORRADOR,
  );

  readonly canFinalize = computed(
    () => this.canManage() && this.competicion()?.estado === EstadoCompeticion.ACTIVA,
  );

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('competicionId'));
      if (Number.isFinite(id)) {
        this.service.resetCurrent();
        this.service.loadDetalle(id);
      }
    });
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab as DetailTab);
  }

  changeEstado(target: EstadoCompeticion): void {
    const c = this.competicion();
    const user = this.auth.currentUser();
    if (!c || !user) return;

    this.service.patchEstado$(c.id, target, user.id).subscribe({
      next: () => {
        this.toast.success(`Estado actualizado a ${target}`);
        this.service.loadDetalle(c.id);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'No se pudo cambiar el estado');
      },
    });
  }

  goCalendar(): void {
    const c = this.competicion();
    if (!c) return;
    this.router.navigate(['/app/competitions', c.id, 'calendar']);
  }

  goNewEvent(): void {
    const c = this.competicion();
    if (!c) return;
    this.router.navigate(['/app/competitions', c.id, 'events', 'new']);
  }

  goEdit(): void {
    const c = this.competicion();
    if (!c) return;
    this.router.navigate(['/app/competitions', c.id, 'edit']);
  }

  async askDelete(): Promise<void> {
    const c = this.competicion();
    const user = this.auth.currentUser();
    if (!c || !user) return;

    const ok = await this.confirm.ask({
      title: '¿Eliminar competición?',
      message: `"${c.nombre}" y todos sus partidos, equipos y estadísticas serán eliminados. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;

    this.service.delete$(c.id, user.id).subscribe({
      next: () => {
        this.toast.success('Competición eliminada');
        this.router.navigate(['/app/competitions']);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'No se pudo eliminar');
      },
    });
  }
}
