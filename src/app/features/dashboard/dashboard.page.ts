import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { forkJoin, of, switchMap } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { CompeticionSimple, EstadoCompeticion } from '@core/models/competicion/competicion.model';
import { Equipo } from '@core/models/equipo/equipo.model';
import { Evento, EstadoEvento } from '@core/models/evento/evento.model';
import { Invitacion, EstadoInvitacion } from '@core/models/invitacion/invitacion.model';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { NotchCardComponent } from '@shared/molecules/notch-card/notch-card.component';
import { TeamPairComponent } from '@shared/molecules/team-pair/team-pair.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { CompetitionCardComponent } from '@shared/components/competition-card/competition-card.component';
import { CalendarStripComponent } from '@shared/organisms/calendar-strip/calendar-strip.component';
import { ToastService } from '@shared/services/toast.service';
import { CompeticionService } from '@features/competitions/services/competicion.service';
import { EventoService } from '@features/events/services/evento.service';
import { EquipoService } from '@features/teams/services/equipo.service';
import { InvitacionService } from '@features/invitations/services/invitacion.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    UpperCasePipe,
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    PageHeaderComponent,
    NotchCardComponent,
    TeamPairComponent,
    EmptyStateComponent,
    CompetitionCardComponent,
    CalendarStripComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly compService = inject(CompeticionService);
  private readonly eventoService = inject(EventoService);
  private readonly equipoService = inject(EquipoService);
  private readonly invitacionService = inject(InvitacionService);
  private readonly toast = inject(ToastService);

  readonly user = this.auth.currentUser;

  // Loading por fuente. Cada sección del template comprueba el suyo, no un
  // loading global bloqueante. Permite que el esqueleto aparezca de inmediato
  // y cada widget se pueble según llega su respuesta.
  readonly loadingParticipadas = signal(true);
  readonly loadingCreadas = signal(true);
  readonly loadingEquipos = signal(true);
  readonly loadingRecibidas = signal(true);
  readonly loadingEnviadas = signal(true);
  readonly loadingEventos = signal(true);

  readonly misCompeticiones = signal<readonly CompeticionSimple[]>([]);
  readonly misCreadas = signal<readonly CompeticionSimple[]>([]);
  readonly misEquiposMgr = signal<readonly Equipo[]>([]);
  readonly invitacionesRecibidas = signal<readonly Invitacion[]>([]);
  readonly invitacionesEnviadas = signal<readonly Invitacion[]>([]);
  private readonly _todosEventos = signal<readonly Evento[]>([]);

  readonly todosEventos = this._todosEventos.asReadonly();

  readonly proximosEventos = computed<readonly Evento[]>(() => {
    const now = Date.now();
    return this._todosEventos()
      .filter((e) => e.estado === EstadoEvento.PROGRAMADO && new Date(e.fechaHora).getTime() > now)
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  });

  readonly nextMatch = computed<Evento | null>(() => this.proximosEventos()[0] ?? null);

  readonly gestionesBorrador = computed<readonly CompeticionSimple[]>(() =>
    this.misCreadas().filter((c) => c.estado === EstadoCompeticion.BORRADOR),
  );

  readonly invitacionesRecibidasPend = computed(() =>
    this.invitacionesRecibidas().filter((i) => i.estado === EstadoInvitacion.PENDIENTE),
  );

  readonly invitacionesEnviadasPend = computed(() =>
    this.invitacionesEnviadas().filter((i) => i.estado === EstadoInvitacion.PENDIENTE),
  );

  readonly gestionesCount = computed(
    () => this.gestionesBorrador().length + this.invitacionesEnviadasPend().length,
  );

  readonly stats = computed(() => ({
    competiciones: this.misCompeticiones().length,
    equipos: this.misEquiposMgr().length,
    partidosProgramados: this.proximosEventos().length,
    invitaciones: this.invitacionesRecibidasPend().length,
  }));

  readonly anyLoading = computed(
    () =>
      this.loadingParticipadas() ||
      this.loadingCreadas() ||
      this.loadingEquipos() ||
      this.loadingRecibidas() ||
      this.loadingEnviadas() ||
      this.loadingEventos(),
  );

  readonly isOnboarding = computed(
    () =>
      !this.anyLoading() &&
      this.misCompeticiones().length === 0 &&
      this.misEquiposMgr().length === 0 &&
      this.invitacionesRecibidasPend().length === 0,
  );

  readonly displayName = computed(() => {
    const u = this.user();
    if (!u) return '';
    return u.nombre || u.username;
  });

  ngOnInit(): void {
    const userId = this.user()?.id;
    if (userId == null) return;
    this.loadAll(userId);
  }

  /**
   * Lanza las 5 cargas independientes + fan-out de eventos.
   * Cada una tiene su propio spinner y actualiza su signal al llegar.
   */
  private loadAll(userId: number): void {
    // Competiciones participadas + fan-out de eventos por competición.
    this.compService
      .misParticipadas$(userId)
      .pipe(
        switchMap((list) => {
          this.misCompeticiones.set(list);
          this.loadingParticipadas.set(false);
          if (list.length === 0) {
            this.loadingEventos.set(false);
            return of([] as Evento[][]);
          }
          return forkJoin(list.map((c) => this.eventoService.findByCompeticion$(c.id)));
        }),
      )
      .subscribe({
        next: (eventsByComp) => {
          this._todosEventos.set(eventsByComp.flat());
          this.loadingEventos.set(false);
        },
        error: (err: ApiError) => {
          this.loadingParticipadas.set(false);
          this.loadingEventos.set(false);
          if (err.status !== 404) this.toast.error(err.message ?? 'Error al cargar competiciones');
        },
      });

    // Competiciones creadas (para gestiones pendientes).
    this.compService.misCreadas$(userId).subscribe({
      next: (list) => {
        this.misCreadas.set(list);
        this.loadingCreadas.set(false);
      },
      error: () => this.loadingCreadas.set(false),
    });

    // Equipos como manager.
    this.equipoService.misEquiposManager$(userId).subscribe({
      next: (list) => {
        this.misEquiposMgr.set(list);
        this.loadingEquipos.set(false);
      },
      error: () => this.loadingEquipos.set(false),
    });

    // Invitaciones recibidas.
    this.invitacionService.findPendientes$(userId).subscribe({
      next: (list) => {
        this.invitacionesRecibidas.set(list);
        this.loadingRecibidas.set(false);
      },
      error: () => this.loadingRecibidas.set(false),
    });

    // Invitaciones enviadas.
    this.invitacionService.findEnviadas$(userId).subscribe({
      next: (list) => {
        this.invitacionesEnviadas.set(list);
        this.loadingEnviadas.set(false);
      },
      error: () => this.loadingEnviadas.set(false),
    });
  }

  openMatch(e: Evento): void {
    this.router.navigate(['/app/competitions', e.competicionId, 'events', e.id]);
  }

  openCompetition(c: CompeticionSimple): void {
    this.router.navigate(['/app/competitions', c.id]);
  }

  openTeam(e: Equipo): void {
    this.router.navigate(['/app/teams', e.id]);
  }

  goNewCompetition(): void {
    this.router.navigate(['/app/competitions/new']);
  }

  goNewTeam(): void {
    this.router.navigate(['/app/teams/new']);
  }

  goCompetitions(): void {
    this.router.navigate(['/app/competitions']);
  }
}
