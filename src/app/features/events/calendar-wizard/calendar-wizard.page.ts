import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import type { ApiError } from '@core/http/api-error.model';
import { FormatoCompeticion } from '@core/models/competicion/competicion.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { IconComponent, type IconName } from '@shared/ui/icon/icon.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { ToastService } from '@shared/services/toast.service';
import { CalendarioService } from '@features/events/services/calendario.service';
import { CompeticionService } from '@features/competitions/services/competicion.service';
import { EquipoService } from '@features/teams/services/equipo.service';

type Mode = 'main' | 'playoff-seeded';

interface ModeOption {
  readonly value: Mode;
  readonly label: string;
  readonly icon: IconName;
}

interface Validacion {
  readonly ok: boolean;
  readonly mensaje: string;
}

@Component({
  selector: 'app-calendar-wizard-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    SpinnerComponent,
    IconComponent,
    PageHeaderComponent,
    FormFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-wizard.page.html',
  styleUrl: './calendar-wizard.page.scss',
})
export class CalendarWizardPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CalendarioService);
  private readonly competicionService = inject(CompeticionService);
  private readonly equipoService = inject(EquipoService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly competicionId = signal<number | null>(null);
  readonly formato = signal<FormatoCompeticion | null>(null);
  readonly numEquiposPlayoff = signal<number | null>(null);
  readonly equiposInscritos = signal<number | null>(null);
  readonly loadingComp = signal(true);
  readonly mode = signal<Mode>('main');
  readonly saving = signal(false);

  readonly availableModes = computed<readonly ModeOption[]>(() => {
    const f = this.formato();
    if (!f) return [];
    switch (f) {
      case FormatoCompeticion.LIGA:
      case FormatoCompeticion.LIGA_IDA_VUELTA:
        return [{ value: 'main', label: 'Generar liga', icon: 'trophy' }];
      case FormatoCompeticion.PLAYOFF:
        return [{ value: 'main', label: 'Generar bracket', icon: 'flag' }];
      case FormatoCompeticion.LIGA_PLAYOFF:
        return [
          { value: 'main', label: 'Generar liga', icon: 'trophy' },
          { value: 'playoff-seeded', label: 'Generar playoff seeded', icon: 'flag' },
        ];
      case FormatoCompeticion.GRUPOS_PLAYOFF:
        return [
          { value: 'main', label: 'Generar fase de grupos', icon: 'trophy' },
          { value: 'playoff-seeded', label: 'Generar playoff seeded', icon: 'flag' },
        ];
      case FormatoCompeticion.EVENTO_UNICO:
        return [];
    }
  });

  readonly formatoSoportado = computed(() => this.availableModes().length > 0);
  readonly mostrarSwitcher = computed(() => this.availableModes().length > 1);
  readonly esPlayoffSeeded = computed(() => this.mode() === 'playoff-seeded');

  /**
   * Comprueba que el número de equipos inscritos cumple los requisitos del
   * formato antes de permitir generar el calendario. La validación del playoff
   * seeded (LIGA_PLAYOFF/GRUPOS_PLAYOFF, paso 2) la hace el backend contra la
   * clasificación, no contra los inscritos: aquí no se valida ese caso.
   */
  readonly validacionEquipos = computed<Validacion>(() => {
    const f = this.formato();
    const inscritos = this.equiposInscritos();
    const playoff = this.numEquiposPlayoff();
    if (!f || inscritos === null) return { ok: true, mensaje: '' };

    switch (f) {
      case FormatoCompeticion.LIGA:
      case FormatoCompeticion.LIGA_IDA_VUELTA:
        if (inscritos < 2) {
          return {
            ok: false,
            mensaje: `Se necesitan al menos 2 equipos inscritos para generar la liga (hay ${inscritos}).`,
          };
        }
        return { ok: true, mensaje: '' };

      case FormatoCompeticion.PLAYOFF:
        if (playoff == null) return { ok: true, mensaje: '' };
        if (inscritos !== playoff) {
          return {
            ok: false,
            mensaje:
              `El playoff requiere exactamente ${playoff} equipos inscritos (hay ${inscritos}). ` +
              `Ajusta el número de equipos del playoff en la configuración o inscribe los equipos restantes.`,
          };
        }
        return { ok: true, mensaje: '' };

      case FormatoCompeticion.LIGA_PLAYOFF:
      case FormatoCompeticion.GRUPOS_PLAYOFF:
        if (this.mode() === 'playoff-seeded') return { ok: true, mensaje: '' };
        if (playoff == null) return { ok: true, mensaje: '' };
        if (inscritos < playoff) {
          return {
            ok: false,
            mensaje:
              `Se necesitan al menos ${playoff} equipos inscritos para llenar la fase eliminatoria (hay ${inscritos}).`,
          };
        }
        return { ok: true, mensaje: '' };

      case FormatoCompeticion.EVENTO_UNICO:
        return { ok: true, mensaje: '' };
    }
  });

  readonly puedeGenerar = computed(
    () => this.formatoSoportado() && this.validacionEquipos().ok && !this.saving(),
  );

  readonly form = this.fb.nonNullable.group({
    fechaInicio: ['', [Validators.required]],
    diasJornada: [7, [Validators.required, Validators.min(1)]],
    rondaInicial: [null as number | null],
  });

  constructor() {
    effect(() => {
      const modes = this.availableModes();
      if (modes.length === 0) return;
      if (!modes.some((m) => m.value === this.mode())) {
        this.mode.set(modes[0].value);
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('competicionId'));
      if (!Number.isFinite(id)) return;
      this.competicionId.set(id);
      this.loadCompetition(id);
    });
  }

  private loadCompetition(id: number): void {
    this.loadingComp.set(true);
    forkJoin({
      competicion: this.competicionService.findByIdDetalle$(id),
      equipos: this.equipoService.findByCompeticion$(id),
    }).subscribe({
      next: ({ competicion, equipos }) => {
        this.formato.set(competicion.configuracion?.formato ?? FormatoCompeticion.LIGA);
        this.numEquiposPlayoff.set(competicion.configuracion?.numEquiposPlayoff ?? null);
        this.equiposInscritos.set(equipos.length);
        this.loadingComp.set(false);
      },
      error: (err: ApiError) => {
        this.loadingComp.set(false);
        this.toast.error(err.message ?? 'No se pudo cargar la competición');
      },
    });
  }

  setMode(m: Mode): void {
    this.mode.set(m);
  }

  generate(): void {
    const compId = this.competicionId();
    if (compId == null) return;
    if (!this.formatoSoportado()) return;
    if (!this.validacionEquipos().ok) {
      this.toast.error(this.validacionEquipos().mensaje);
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { fechaInicio, diasJornada, rondaInicial } = this.form.getRawValue();
    const req = { fechaInicio, diasJornada };

    this.saving.set(true);
    const obs =
      this.mode() === 'playoff-seeded'
        ? this.service.generarPlayoff$(compId, req, rondaInicial ?? undefined)
        : this.service.generar$(compId, req);

    obs.subscribe({
      next: (eventos) => {
        this.saving.set(false);
        this.toast.success(`Calendario generado · ${eventos.length} partidos`);
        this.router.navigate(['/app/competitions', compId]);
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.toast.error(err.message ?? 'No se pudo generar el calendario');
      },
    });
  }

  cancel(): void {
    const compId = this.competicionId();
    if (compId != null) this.router.navigate(['/app/competitions', compId]);
    else this.router.navigate(['/app/competitions']);
  }
}
