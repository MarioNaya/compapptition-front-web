import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/services/auth.service';
import { EstadoCompeticion, FormatoCompeticion } from '@core/models/competicion/competicion.model';
import { ApiError } from '@core/http/api-error.model';
import { RolCompeticion } from '@core/models/rol';
import { InvitacionService } from '@features/invitations/services/invitacion.service';
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
import { CalendarTabComponent } from './components/calendar-tab/calendar-tab.component';

type DetailTab = 'matches' | 'calendar' | 'standings' | 'teams' | 'stats' | 'bracket';

const PLAYOFF_FORMATS = new Set<FormatoCompeticion>([
  FormatoCompeticion.PLAYOFF,
  FormatoCompeticion.LIGA_PLAYOFF,
  FormatoCompeticion.GRUPOS_PLAYOFF,
]);

/** Etiquetas legibles para mostrar al usuario en lugar del valor de BD. */
const FORMATO_LABEL: Record<FormatoCompeticion, string> = {
  [FormatoCompeticion.LIGA]: 'Liga',
  [FormatoCompeticion.LIGA_IDA_VUELTA]: 'Liga ida y vuelta',
  [FormatoCompeticion.PLAYOFF]: 'Playoff',
  [FormatoCompeticion.LIGA_PLAYOFF]: 'Liga + playoff',
  [FormatoCompeticion.GRUPOS_PLAYOFF]: 'Grupos + playoff',
  [FormatoCompeticion.EVENTO_UNICO]: 'Evento único',
};

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
    CalendarTabComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './competition-detail.page.html',
  styleUrl: './competition-detail.page.scss',
})
export class CompetitionDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(CompeticionService);
  private readonly invitacionService = inject(InvitacionService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  // Panel "Invitar árbitro" — solo visible para admins de la competición.
  readonly showInviteArbitro = signal(false);
  readonly arbitroEmail = signal('');
  readonly arbitroUsername = signal('');
  readonly invitingArbitro = signal(false);

  readonly competicion = this.service.current;
  readonly loading = this.service.loading;
  readonly activeTab = signal<DetailTab>('matches');

  readonly EstadoCompeticion = EstadoCompeticion;

  readonly hasBracket = computed(() => {
    const formato = this.competicion()?.configuracion?.formato;
    return !!formato && PLAYOFF_FORMATS.has(formato);
  });

  /** Devuelve la etiqueta legible para un formato (o null si no hay valor). */
  formatoLabel(f: FormatoCompeticion | null | undefined): string | null {
    return f ? FORMATO_LABEL[f] : null;
  }

  readonly tabs = computed<readonly TabOption[]>(() => {
    const base: TabOption[] = [
      { label: 'Partidos', value: 'matches' },
      { label: 'Calendario', value: 'calendar' },
      { label: 'Clasificación', value: 'standings' },
      { label: 'Equipos', value: 'teams' },
      { label: 'Estadísticas', value: 'stats' },
    ];
    if (this.hasBracket()) {
      base.splice(3, 0, { label: 'Cuadro', value: 'bracket' });
    }
    return base;
  });

  /**
   * Puede gestionar la competición (editar, borrar, cambiar estado, crear
   * eventos): el creador, cualquier admin de la competición o un admin del
   * sistema. Antes solo se permitía al creador, lo que dejaba fuera a los
   * admins añadidos por invitación.
   */
  readonly canManage = computed(() => {
    const c = this.competicion();
    if (!c) return false;
    if (this.auth.isAdminSistema()) return true;
    const user = this.auth.currentUser();
    if (user && c.creadorId === user.id) return true;
    return this.auth.isAdminCompeticion(c.id);
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

  /**
   * Abre/cierra el panel de invitación a árbitro y limpia los campos al abrir.
   */
  toggleInviteArbitro(): void {
    this.showInviteArbitro.update((v) => !v);
    if (this.showInviteArbitro()) {
      this.arbitroEmail.set('');
      this.arbitroUsername.set('');
    }
  }

  onArbitroEmail(v: string): void { this.arbitroEmail.set(v); }
  onArbitroUsername(v: string): void { this.arbitroUsername.set(v); }

  /**
   * Envía una invitación con rol ARBITRO al destinatario indicado por email
   * o por username. El backend ya valida unicidad y permisos.
   */
  enviarInvitacionArbitro(): void {
    const c = this.competicion();
    if (!c) return;
    const email = this.arbitroEmail().trim();
    const username = this.arbitroUsername().trim();
    if (!email && !username) {
      this.toast.error('Indica un email o un nombre de usuario');
      return;
    }
    this.invitingArbitro.set(true);
    this.invitacionService
      .create$({
        destinatarioEmail: email || undefined,
        destinatarioUsername: username || undefined,
        competicionId: c.id,
        rolOfrecido: RolCompeticion.ARBITRO,
      })
      .subscribe({
        next: () => {
          this.invitingArbitro.set(false);
          this.toast.success('Invitación enviada');
          this.showInviteArbitro.set(false);
        },
        error: (err: ApiError) => {
          this.invitingArbitro.set(false);
          this.toast.error(err.message ?? 'No se pudo enviar la invitación');
        },
      });
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
