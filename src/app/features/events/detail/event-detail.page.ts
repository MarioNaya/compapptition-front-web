import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Evento, EstadoEvento } from '@core/models/evento/evento.model';
import { Competicion } from '@core/models/competicion/competicion.model';
import { EstadisticaJugador, TipoEstadistica } from '@core/models/estadistica/estadistica.model';
import { Jugador } from '@core/models/equipo/jugador.model';
import { ApiError } from '@core/http/api-error.model';
import { AuthService } from '@core/services/auth.service';
import { DeporteService } from '@features/admin/sports/services/deporte.service';
import { EquipoService } from '@features/teams/services/equipo.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { TeamPairComponent } from '@shared/molecules/team-pair/team-pair.component';
import { StatusTagComponent } from '@shared/molecules/status-tag/status-tag.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { EventoService } from '@features/events/services/evento.service';
import { CompeticionService } from '@features/competitions/services/competicion.service';
import { EventStatsPanelComponent } from './components/event-stats-panel/event-stats-panel.component';

@Component({
  selector: 'app-event-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    UpperCasePipe,
    ReactiveFormsModule,
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    TeamPairComponent,
    StatusTagComponent,
    FormFieldComponent,
    EventStatsPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './event-detail.page.html',
  styleUrl: './event-detail.page.scss',
})
export class EventDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(EventoService);
  private readonly competicionService = inject(CompeticionService);
  private readonly deporteService = inject(DeporteService);
  private readonly equipoService = inject(EquipoService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly evento = signal<Evento | null>(null);
  readonly competicion = signal<Competicion | null>(null);
  readonly competicionId = signal<number | null>(null);
  readonly estadisticas = signal<readonly EstadisticaJugador[]>([]);
  readonly tiposEstadistica = signal<readonly TipoEstadistica[]>([]);
  readonly jugadoresLocal = signal<readonly Jugador[]>([]);
  readonly jugadoresVisitante = signal<readonly Jugador[]>([]);

  /**
   * Construye una tabla pivote de estadísticas por jugador. Una fila por
   * jugador (locales primero, luego visitantes) y una columna por tipo de
   * estadística del deporte. Los huecos se rellenan con 0.
   */
  readonly statsTable = computed<{
    tipos: readonly TipoEstadistica[];
    rows: readonly {
      jugadorId: number;
      jugadorNombre: string;
      dorsal: number | null;
      lado: 'local' | 'visitante';
      valores: readonly number[];
    }[];
  }>(() => {
    const tipos = [...this.tiposEstadistica()].sort((a, b) => a.orden - b.orden);
    const stats = this.estadisticas();

    // Mapa jugadorId → Map<tipoId, valor>
    const valoresPorJugador = new Map<number, Map<number, number>>();
    for (const s of stats) {
      let mapa = valoresPorJugador.get(s.jugadorId);
      if (!mapa) {
        mapa = new Map<number, number>();
        valoresPorJugador.set(s.jugadorId, mapa);
      }
      // Si hubiera duplicados (no debería, el backend hace upsert), suma.
      mapa.set(s.tipoEstadisticaId, (mapa.get(s.tipoEstadisticaId) ?? 0) + s.valor);
    }

    const buildRow = (j: Jugador, lado: 'local' | 'visitante') => ({
      jugadorId: j.id,
      jugadorNombre: `${j.nombre}${j.apellidos ? ' ' + j.apellidos : ''}`,
      dorsal: j.dorsal ?? null,
      lado,
      valores: tipos.map((t) => valoresPorJugador.get(j.id)?.get(t.id) ?? 0),
    });

    const sortDorsal = (a: Jugador, b: Jugador) => {
      const da = a.dorsal ?? Number.MAX_SAFE_INTEGER;
      const db = b.dorsal ?? Number.MAX_SAFE_INTEGER;
      if (da !== db) return da - db;
      return a.nombre.localeCompare(b.nombre);
    };

    const rowsLocal = [...this.jugadoresLocal()].sort(sortDorsal).map((j) => buildRow(j, 'local'));
    const rowsVisitante = [...this.jugadoresVisitante()].sort(sortDorsal).map((j) => buildRow(j, 'visitante'));

    return { tipos, rows: [...rowsLocal, ...rowsVisitante] };
  });

  /** Solo admin de competición o árbitro pueden tocar resultados/estadísticas. */
  readonly canEditResults = computed(() =>
    this.auth.puedeEditarResultadosEnCompeticion(this.competicionId()),
  );

  /** Reabrir/borrar/editar partido es solo de admin de competición. */
  readonly canManageEvent = computed(() =>
    this.auth.isAdminCompeticion(this.competicionId()),
  );

  readonly canRegister = computed(() => {
    const e = this.evento();
    if (!e) return false;
    if (e.bloqueado) return false;
    if (!this.canEditResults()) return false;
    return e.estado !== EstadoEvento.FINALIZADO && e.estado !== EstadoEvento.SUSPENDIDO;
  });

  readonly canRegisterStats = computed(() => {
    const c = this.competicion();
    const e = this.evento();
    if (!c || !c.estadisticasActivas) return false;
    if (!e || e.bloqueado) return false;
    // Una vez el partido está FINALIZADO o SUSPENDIDO, las estadísticas se
    // visualizan en la tabla de abajo; no se permite seguir registrando ni
    // editando desde el formulario flotante. Al reabrir el partido vuelve a
    // aparecer.
    if (e.estado === EstadoEvento.FINALIZADO || e.estado === EstadoEvento.SUSPENDIDO) {
      return false;
    }
    return this.canEditResults();
  });

  /** El partido está finalizado y el admin puede reabrirlo. */
  readonly canReopen = computed(() => {
    const e = this.evento();
    if (!e) return false;
    if (e.bloqueado) return false;
    return e.estado === EstadoEvento.FINALIZADO && this.canManageEvent();
  });

  readonly resultForm = this.fb.nonNullable.group({
    resultadoLocal: [0, [Validators.required, Validators.min(0)]],
    resultadoVisitante: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const competicionId = Number(params.get('competicionId'));
      const eventoId = Number(params.get('eventoId'));
      if (Number.isFinite(competicionId) && Number.isFinite(eventoId)) {
        this.competicionId.set(competicionId);
        this.load(competicionId, eventoId);
      }
    });
  }

  private load(competicionId: number, eventoId: number): void {
    this.loading.set(true);
    forkJoin({
      evento: this.service.findById$(competicionId, eventoId),
      competicion: this.competicionService.findByIdDetalle$(competicionId),
      estadisticas: this.service.estadisticas$(competicionId, eventoId),
    }).subscribe({
      next: ({ evento: e, competicion: c, estadisticas }) => {
        this.evento.set(e);
        this.competicion.set(c);
        this.estadisticas.set(estadisticas);
        if (e.resultadoLocal != null && e.resultadoVisitante != null) {
          this.resultForm.patchValue({
            resultadoLocal: e.resultadoLocal,
            resultadoVisitante: e.resultadoVisitante,
          });
        }
        this.loading.set(false);
        // Carga adicional para construir la tabla pivote (no es bloqueante).
        this.loadStatsContext(c.deporteId, e);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'Error al cargar el partido');
        this.loading.set(false);
      },
    });
  }

  /**
   * Carga los datos contextuales para la tabla pivote: tipos de estadística
   * del deporte y plantilla de los dos equipos. Es resistente a fallos
   * parciales (si un equipo no tiene jugadores devolvemos []).
   */
  private loadStatsContext(deporteId: number, e: Evento): void {
    this.deporteService.findTiposEstadistica$(deporteId).subscribe({
      next: (tipos) => this.tiposEstadistica.set(tipos),
      error: () => this.tiposEstadistica.set([]),
    });

    const localId = e.equipoLocal?.id;
    if (localId != null) {
      this.equipoService.findJugadores$(localId).subscribe({
        next: (list) => this.jugadoresLocal.set(list),
        error: () => this.jugadoresLocal.set([]),
      });
    } else {
      this.jugadoresLocal.set([]);
    }

    const visitanteId = e.equipoVisitante?.id;
    if (visitanteId != null) {
      this.equipoService.findJugadores$(visitanteId).subscribe({
        next: (list) => this.jugadoresVisitante.set(list),
        error: () => this.jugadoresVisitante.set([]),
      });
    } else {
      this.jugadoresVisitante.set([]);
    }
  }

  submitResult(): void {
    const e = this.evento();
    const compId = this.competicionId();
    if (!e || compId == null) return;
    if (this.resultForm.invalid) {
      this.resultForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.service
      .registrarResultado$(compId, e.id, this.resultForm.getRawValue())
      .subscribe({
        next: () => {
          this.toast.success('Resultado registrado');
          // Recargar el evento detalle para tener `bloqueado`, `estado` y
          // resto de campos del DTO completo. El endpoint /resultado devuelve
          // un DTO reducido y nos quedaríamos sin esa info, lo que provoca
          // que el panel de stats interprete mal el estado.
          this.service.findById$(compId, e.id).subscribe({
            next: (updated) => {
              this.evento.set(updated);
              this.saving.set(false);
              this.refreshStats();
            },
            error: () => {
              this.saving.set(false);
            },
          });
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.toast.error(err.message ?? 'No se pudo registrar el resultado');
        },
      });
  }

  async askDelete(): Promise<void> {
    const e = this.evento();
    const compId = this.competicionId();
    if (!e || compId == null) return;
    const ok = await this.confirm.ask({
      title: '¿Eliminar partido?',
      message: 'El partido se eliminará. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    this.service.delete$(compId, e.id).subscribe({
      next: () => {
        this.toast.success('Partido eliminado');
        this.router.navigate(['/app/competitions', compId]);
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo eliminar'),
    });
  }

  /**
   * Lo invoca event-stats-panel tras registrar una estadística para que el
   * listado de la sección "Estadísticas del partido" se mantenga al día.
   */
  refreshStats(): void {
    const compId = this.competicionId();
    const e = this.evento();
    if (compId == null || !e) return;
    this.service.estadisticas$(compId, e.id).subscribe({
      next: (list) => this.estadisticas.set(list),
      error: () => {
        // No bloqueamos UX por un fallo de refresco; el usuario verá la stat al recargar.
      },
    });
  }

  /**
   * Reabre un partido FINALIZADO pasándolo a PROGRAMADO. El backend limpia
   * los marcadores y recalcula la clasificación; al volver a registrar el
   * resultado todo queda consistente.
   */
  async reabrir(): Promise<void> {
    const e = this.evento();
    const compId = this.competicionId();
    if (!e || compId == null) return;
    const ok = await this.confirm.ask({
      title: '¿Reabrir partido?',
      message: 'El partido pasará a estado PROGRAMADO. Se borrarán los marcadores actuales y la clasificación se recalculará. Tendrás que volver a registrar el resultado correcto.',
      confirmLabel: 'Reabrir',
      destructive: true,
    });
    if (!ok) return;
    this.saving.set(true);
    this.service.cambiarEstado$(compId, e.id, EstadoEvento.PROGRAMADO).subscribe({
      next: (updated) => {
        this.evento.set(updated);
        this.resultForm.patchValue({ resultadoLocal: 0, resultadoVisitante: 0 });
        this.saving.set(false);
        this.toast.success('Partido reabierto');
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.toast.error(err.message ?? 'No se pudo reabrir el partido');
      },
    });
  }
}
