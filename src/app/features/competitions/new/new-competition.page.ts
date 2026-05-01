import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormatoCompeticion } from '@core/models/competicion/competicion.model';
import { Deporte } from '@core/models/deporte/deporte.model';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { ToastService } from '@shared/services/toast.service';
import { AuthService } from '@core/services/auth.service';
import { CompeticionService } from '@features/competitions/services/competicion.service';
import { DeporteService } from '@features/admin/sports/services/deporte.service';

const LIGA_FORMATOS = new Set<FormatoCompeticion>([
  FormatoCompeticion.LIGA,
  FormatoCompeticion.LIGA_IDA_VUELTA,
  FormatoCompeticion.LIGA_PLAYOFF,
  FormatoCompeticion.GRUPOS_PLAYOFF,
]);

const PLAYOFF_FORMATOS = new Set<FormatoCompeticion>([
  FormatoCompeticion.PLAYOFF,
  FormatoCompeticion.LIGA_PLAYOFF,
  FormatoCompeticion.GRUPOS_PLAYOFF,
]);

const GRUPOS_FORMATOS = new Set<FormatoCompeticion>([
  FormatoCompeticion.GRUPOS_PLAYOFF,
]);

@Component({
  selector: 'app-new-competition-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    SpinnerComponent,
    PageHeaderComponent,
    FormFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-competition.page.html',
  styleUrl: './new-competition.page.scss',
})
export class NewCompetitionPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CompeticionService);
  private readonly deporteService = inject(DeporteService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly saving = signal(false);
  readonly deportes = signal<readonly Deporte[]>([]);
  readonly loadingDeportes = signal(true);

  readonly formatos: readonly { value: FormatoCompeticion; label: string }[] = [
    { value: FormatoCompeticion.LIGA, label: 'Liga (una vuelta)' },
    { value: FormatoCompeticion.LIGA_IDA_VUELTA, label: 'Liga ida y vuelta' },
    { value: FormatoCompeticion.PLAYOFF, label: 'Playoff (eliminatoria directa)' },
    { value: FormatoCompeticion.LIGA_PLAYOFF, label: 'Liga + playoff' },
    { value: FormatoCompeticion.GRUPOS_PLAYOFF, label: 'Grupos + playoff' },
    { value: FormatoCompeticion.EVENTO_UNICO, label: 'Evento único' },
  ];

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    descripcion: [''],
    deporteId: [null as number | null, [Validators.required]],
    publica: [true],
    inscripcionAbierta: [true],
    estadisticasActivas: [true],
    fechaInicio: [''],
    fechaFin: [''],
    configuracion: this.fb.nonNullable.group({
      formato: [FormatoCompeticion.LIGA, [Validators.required]],
      puntosVictoria: [3, [Validators.required, Validators.min(0), Validators.max(10)]],
      puntosEmpate: [1, [Validators.required, Validators.min(0), Validators.max(10)]],
      puntosDerrota: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
      numEquiposPlayoff: [8, [Validators.min(2), Validators.max(64)]],
      partidosEliminatoria: [1, [Validators.min(1), Validators.max(7)]],
      numGrupos: [null as number | null, [Validators.min(2), Validators.max(16)]],
    }),
  });

  private readonly formatoSignal = toSignal(this.form.controls.configuracion.controls.formato.valueChanges, {
    initialValue: FormatoCompeticion.LIGA,
  });

  readonly showLigaFields = computed(() => LIGA_FORMATOS.has(this.formatoSignal()));
  readonly showPlayoffFields = computed(() => PLAYOFF_FORMATOS.has(this.formatoSignal()));
  readonly showGruposFields = computed(() => GRUPOS_FORMATOS.has(this.formatoSignal()));

  ngOnInit(): void {
    this.deporteService.findAll$().subscribe({
      next: (list) => {
        this.deportes.set(list.filter((d) => d.activo));
        this.loadingDeportes.set(false);
      },
      error: (err: ApiError) => {
        this.loadingDeportes.set(false);
        this.toast.error(err.message ?? 'No se pudieron cargar los deportes');
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const cfg = v.configuracion;
    const showLiga = LIGA_FORMATOS.has(cfg.formato);
    const showPlayoff = PLAYOFF_FORMATOS.has(cfg.formato);
    const showGrupos = GRUPOS_FORMATOS.has(cfg.formato);

    this.service
      .create$({
        nombre: v.nombre,
        descripcion: v.descripcion || undefined,
        deporteId: v.deporteId!,
        publica: v.publica,
        inscripcionAbierta: v.inscripcionAbierta,
        estadisticasActivas: v.estadisticasActivas,
        fechaInicio: v.fechaInicio || undefined,
        fechaFin: v.fechaFin || undefined,
        configuracion: {
          formato: cfg.formato,
          puntosVictoria: showLiga ? cfg.puntosVictoria : undefined,
          puntosEmpate: showLiga ? cfg.puntosEmpate : undefined,
          puntosDerrota: showLiga ? cfg.puntosDerrota : undefined,
          numEquiposPlayoff: showPlayoff ? cfg.numEquiposPlayoff : undefined,
          partidosEliminatoria: showPlayoff ? cfg.partidosEliminatoria : undefined,
          numGrupos: showGrupos && cfg.numGrupos != null ? cfg.numGrupos : undefined,
        },
      })
      .subscribe({
        next: (comp) => {
          this.toast.success('Competición creada');
          // El backend asigna ADMIN_COMPETICION al creador, pero el JWT
          // actual lleva los roles cacheados al login. Refrescamos el token
          // para que el frontend reconozca el rol nuevo y muestre los CTAs
          // de gestión (invitar manager/árbitro, añadir equipos, etc.).
          this.auth.refreshToken().subscribe({
            next: () => this.router.navigate(['/app/competitions', comp.id]),
            error: () => this.router.navigate(['/app/competitions', comp.id]),
          });
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.toast.error(err.message ?? 'No se pudo crear la competición');
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/app/dashboard']);
  }
}
