import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { forkJoin, of, switchMap } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import {
  CompeticionSimple,
  EstadoCompeticion,
  MisCompeticionesPorRol,
} from '@core/models/competicion/competicion.model';
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

type EquipoConRol = Equipo & { rol: string };

type RolKey = 'admin' | 'manager' | 'arbitro' | 'jugador';

interface CompGroup {
  readonly key: RolKey;
  readonly title: string;
  readonly emptyMessage: string;
  readonly items: readonly CompeticionSimple[];
}

const EMPTY_POR_ROL: MisCompeticionesPorRol = {
  admin: [],
  manager: [],
  arbitro: [],
  jugador: [],
};

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
  readonly loadingPorRol = signal(true);
  readonly loadingCreadas = signal(true);
  readonly loadingEquiposManager = signal(true);
  readonly loadingEquiposCreados = signal(true);
  readonly loadingEquiposJugador = signal(true);
  readonly loadingRecibidas = signal(true);
  readonly loadingEnviadas = signal(true);
  readonly loadingEventos = signal(true);

  readonly misPorRol = signal<MisCompeticionesPorRol>(EMPTY_POR_ROL);
  readonly misCreadas = signal<readonly CompeticionSimple[]>([]);
  private readonly _equiposManager = signal<readonly Equipo[]>([]);
  private readonly _equiposCreados = signal<readonly Equipo[]>([]);
  private readonly _equiposJugador = signal<readonly Equipo[]>([]);
  readonly invitacionesRecibidas = signal<readonly Invitacion[]>([]);
  readonly invitacionesEnviadas = signal<readonly Invitacion[]>([]);
  private readonly _todosEventos = signal<readonly Evento[]>([]);

  readonly todosEventos = this._todosEventos.asReadonly();

  /**
   * Unión deduplicada (por id) de las cuatro listas. Sirve como fuente de
   * verdad para fan-out de eventos, contadores y onboarding.
   */
  readonly misCompeticiones = computed<readonly CompeticionSimple[]>(() => {
    const por = this.misPorRol();
    const map = new Map<number, CompeticionSimple>();
    for (const c of [...por.admin, ...por.manager, ...por.arbitro, ...por.jugador]) {
      map.set(c.id, c);
    }
    return [...map.values()];
  });

  /**
   * Lista ordenada de los 4 grupos para el render del dashboard.
   * Cada grupo se pinta solo si tiene al menos una competición.
   */
  readonly compGroups = computed<readonly CompGroup[]>(() => {
    const por = this.misPorRol();
    return [
      {
        key: 'admin' as const,
        title: 'Como administrador',
        emptyMessage: 'No administras ninguna competición.',
        items: por.admin,
      },
      {
        key: 'manager' as const,
        title: 'Como manager de equipo',
        emptyMessage: 'No gestionas equipos en ninguna competición.',
        items: por.manager,
      },
      {
        key: 'arbitro' as const,
        title: 'Como árbitro',
        emptyMessage: 'No arbitras ninguna competición.',
        items: por.arbitro,
      },
      {
        key: 'jugador' as const,
        title: 'Como jugador',
        emptyMessage: 'No estás inscrito como jugador en ninguna competición.',
        items: por.jugador,
      },
    ];
  });

  /**
   * Unión de equipos del usuario: creador + manager + jugador. Deduplica por
   * id y etiqueta con el rol principal (prioridad creador > manager > jugador).
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
    return [...map.values()];
  });

  readonly loadingEquipos = computed(
    () =>
      this.loadingEquiposManager() ||
      this.loadingEquiposCreados() ||
      this.loadingEquiposJugador(),
  );

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

  readonly invitacionesEnviadasPend = computed(() => {
    const now = Date.now();
    return this.invitacionesEnviadas().filter((i) => {
      if (i.estado !== EstadoInvitacion.PENDIENTE) return false;
      // Algunas invitaciones se quedan en BD con estado PENDIENTE pero con
      // la fecha de expiración pasada (el backend solo las marca EXPIRADAS
      // cuando alguien intenta aceptarlas). Las descartamos para que no
      // ensucien la sección "Gestiones pendientes".
      if (i.fechaExpiracion) {
        const exp = new Date(i.fechaExpiracion).getTime();
        if (Number.isFinite(exp) && exp < now) return false;
      }
      return true;
    });
  });

  readonly gestionesCount = computed(
    () => this.gestionesBorrador().length + this.invitacionesEnviadasPend().length,
  );

  readonly stats = computed(() => ({
    competiciones: this.misCompeticiones().length,
    equipos: this.misEquipos().length,
    partidosProgramados: this.proximosEventos().length,
    invitaciones: this.invitacionesRecibidasPend().length,
  }));

  readonly anyLoading = computed(
    () =>
      this.loadingPorRol() ||
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
      this.misEquipos().length === 0 &&
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
   * Lanza las 7 cargas independientes (participadas, creadas, 3 fuentes de
   * equipos, invitaciones recibidas y enviadas) + fan-out de eventos.
   * Cada una tiene su propio spinner y actualiza su signal al llegar.
   */
  private loadAll(userId: number): void {
    // Competiciones del usuario agrupadas por rol + fan-out de eventos sobre
    // la unión deduplicada de las 4 listas.
    this.compService
      .misCompeticionesPorRol$(userId)
      .pipe(
        switchMap((porRol) => {
          this.misPorRol.set(porRol);
          this.loadingPorRol.set(false);
          const ids = new Set<number>();
          for (const c of [...porRol.admin, ...porRol.manager, ...porRol.arbitro, ...porRol.jugador]) {
            ids.add(c.id);
          }
          if (ids.size === 0) {
            this.loadingEventos.set(false);
            return of([] as Evento[][]);
          }
          return forkJoin([...ids].map((id) => this.eventoService.findByCompeticion$(id)));
        }),
      )
      .subscribe({
        next: (eventsByComp) => {
          this._todosEventos.set(eventsByComp.flat());
          this.loadingEventos.set(false);
        },
        error: (err: ApiError) => {
          this.loadingPorRol.set(false);
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

    // Equipos: 3 fuentes que el computed `misEquipos` deduplica.
    this.equipoService.misEquiposCreados$(userId).subscribe({
      next: (list) => {
        this._equiposCreados.set(list);
        this.loadingEquiposCreados.set(false);
      },
      error: () => this.loadingEquiposCreados.set(false),
    });

    this.equipoService.misEquiposManager$(userId).subscribe({
      next: (list) => {
        this._equiposManager.set(list);
        this.loadingEquiposManager.set(false);
      },
      error: () => this.loadingEquiposManager.set(false),
    });

    this.equipoService.misEquiposJugador$(userId).subscribe({
      next: (list) => {
        this._equiposJugador.set(list);
        this.loadingEquiposJugador.set(false);
      },
      error: () => this.loadingEquiposJugador.set(false),
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
