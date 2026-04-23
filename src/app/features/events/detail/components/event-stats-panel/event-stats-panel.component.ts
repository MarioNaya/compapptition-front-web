import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Jugador } from '@core/models/equipo/jugador.model';
import { TipoEstadistica, TipoValor } from '@core/models/estadistica/estadistica.model';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { ToastService } from '@shared/services/toast.service';
import { EstadisticaService } from '@features/events/services/estadistica.service';
import { DeporteService } from '@features/admin/sports/services/deporte.service';
import { EquipoService } from '@features/teams/services/equipo.service';

interface PlayerOption {
  readonly id: number;
  readonly label: string;
  readonly equipoNombre: string;
}

@Component({
  selector: 'app-event-stats-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    EmptyStateComponent,
    FormFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './event-stats-panel.component.html',
  styleUrl: './event-stats-panel.component.scss',
})
export class EventStatsPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly deporteService = inject(DeporteService);
  private readonly equipoService = inject(EquipoService);
  private readonly service = inject(EstadisticaService);
  private readonly toast = inject(ToastService);

  readonly eventoId = input.required<number>();
  readonly deporteId = input.required<number>();
  readonly equipoLocalId = input<number | null>(null);
  readonly equipoLocalNombre = input<string>('Local');
  readonly equipoVisitanteId = input<number | null>(null);
  readonly equipoVisitanteNombre = input<string>('Visitante');

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly tipos = signal<readonly TipoEstadistica[]>([]);
  readonly jugadores = signal<readonly PlayerOption[]>([]);

  readonly form = this.fb.nonNullable.group({
    jugadorId: [null as number | null, [Validators.required]],
    tipoEstadisticaId: [null as number | null, [Validators.required]],
    valor: [0, [Validators.required, Validators.min(0)]],
  });

  readonly selectedTipo = computed(() => {
    const id = this.form.controls.tipoEstadisticaId.value;
    return this.tipos().find((t) => t.id === id) ?? null;
  });

  readonly TipoValor = TipoValor;

  constructor() {
    // Cuando los inputs requeridos están listos, carga tipos + jugadores.
    effect(() => {
      const deporte = this.deporteId();
      const local = this.equipoLocalId();
      const visitante = this.equipoVisitanteId();
      if (deporte == null) return;
      this.loadData(deporte, local, visitante);
    });
  }

  ngOnInit(): void {
    // effect del constructor arranca la carga.
  }

  private loadData(deporteId: number, localId: number | null, visitanteId: number | null): void {
    this.loading.set(true);
    const jugadoresObs = forkJoin({
      local: localId != null ? this.equipoService.findJugadores$(localId) : forkJoin([]),
      visitante: visitanteId != null ? this.equipoService.findJugadores$(visitanteId) : forkJoin([]),
    });

    forkJoin({
      tipos: this.deporteService.findTiposEstadistica$(deporteId),
      equipos: jugadoresObs,
    }).subscribe({
      next: ({ tipos, equipos }) => {
        this.tipos.set(tipos);
        const options: PlayerOption[] = [];
        const localNombre = this.equipoLocalNombre();
        const visitanteNombre = this.equipoVisitanteNombre();
        (equipos.local as Jugador[] | []).forEach((j) =>
          options.push({
            id: j.id,
            label: this.displayName(j),
            equipoNombre: localNombre,
          }),
        );
        (equipos.visitante as Jugador[] | []).forEach((j) =>
          options.push({
            id: j.id,
            label: this.displayName(j),
            equipoNombre: visitanteNombre,
          }),
        );
        this.jugadores.set(options);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        if (err.status !== 404) this.toast.error(err.message ?? 'Error al cargar datos del panel');
      },
    });
  }

  private displayName(j: Jugador): string {
    const base = `${j.nombre}${j.apellidos ? ' ' + j.apellidos : ''}`;
    return j.dorsal ? `#${j.dorsal} ${base}` : base;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (v.jugadorId == null || v.tipoEstadisticaId == null) return;

    // Validación cliente por TipoValor, alineada con backend.
    const tipo = this.selectedTipo();
    if (tipo) {
      if (tipo.tipoValor === TipoValor.ENTERO && v.valor % 1 !== 0) {
        this.toast.error('El valor debe ser un número entero.');
        return;
      }
      if (tipo.tipoValor === TipoValor.BOOLEANO && v.valor !== 0 && v.valor !== 1) {
        this.toast.error('Para BOOLEANO el valor debe ser 0 o 1.');
        return;
      }
    }

    this.saving.set(true);
    this.service
      .crear$({
        eventoId: this.eventoId(),
        jugadorId: v.jugadorId,
        tipoEstadisticaId: v.tipoEstadisticaId,
        valor: v.valor,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Estadística registrada');
          this.form.patchValue({ valor: 0 });
          // dejamos el jugador y tipo para registrar rápido varias filas
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.toast.error(err.message ?? 'No se pudo registrar');
        },
      });
  }
}
