import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/services/auth.service';
import { Competicion, FormatoCompeticion } from '@core/models/competicion/competicion.model';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { ToastService } from '@shared/services/toast.service';
import { CompeticionService } from '@features/competitions/services/competicion.service';

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

@Component({
  selector: 'app-edit-competition-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    SpinnerComponent,
    PageHeaderComponent,
    FormFieldComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-competition.page.html',
  styleUrl: './edit-competition.page.scss',
})
export class EditCompetitionPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CompeticionService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly competicion = signal<Competicion | null>(null);
  readonly notFound = signal(false);

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
    }),
  });

  private readonly formatoSignal = toSignal(this.form.controls.configuracion.controls.formato.valueChanges, {
    initialValue: FormatoCompeticion.LIGA,
  });

  readonly showLigaFields = computed(() => LIGA_FORMATOS.has(this.formatoSignal()));
  readonly showPlayoffFields = computed(() => PLAYOFF_FORMATOS.has(this.formatoSignal()));

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('competicionId'));
      if (!Number.isFinite(id)) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }
      this.load(id);
    });
  }

  private load(id: number): void {
    this.loading.set(true);
    this.service.findByIdDetalle$(id).subscribe({
      next: (c) => {
        this.competicion.set(c);
        this.form.patchValue({
          nombre: c.nombre,
          descripcion: c.descripcion ?? '',
          publica: c.publica,
          inscripcionAbierta: c.inscripcionAbierta,
          estadisticasActivas: c.estadisticasActivas,
          fechaInicio: c.fechaInicio ?? '',
          fechaFin: c.fechaFin ?? '',
          configuracion: {
            formato: c.configuracion?.formato ?? FormatoCompeticion.LIGA,
            puntosVictoria: c.configuracion?.puntosVictoria ?? 3,
            puntosEmpate: c.configuracion?.puntosEmpate ?? 1,
            puntosDerrota: c.configuracion?.puntosDerrota ?? 0,
            numEquiposPlayoff: c.configuracion?.numEquiposPlayoff ?? 8,
            partidosEliminatoria: c.configuracion?.partidosEliminatoria ?? 1,
          },
        });
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        if (err.status === 404) this.notFound.set(true);
        else this.toast.error(err.message ?? 'Error al cargar la competición');
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const c = this.competicion();
    const user = this.auth.currentUser();
    if (!c || !user) return;

    this.saving.set(true);
    const v = this.form.getRawValue();
    const cfg = v.configuracion;
    const showLiga = LIGA_FORMATOS.has(cfg.formato);
    const showPlayoff = PLAYOFF_FORMATOS.has(cfg.formato);

    this.service
      .update$(
        c.id,
        {
          nombre: v.nombre,
          descripcion: v.descripcion || undefined,
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
          },
        },
        user.id,
      )
      .subscribe({
        next: () => {
          this.toast.success('Competición actualizada');
          this.router.navigate(['/app/competitions', c.id]);
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.toast.error(err.message ?? 'No se pudo actualizar');
        },
      });
  }

  cancel(): void {
    const c = this.competicion();
    if (c) this.router.navigate(['/app/competitions', c.id]);
    else this.router.navigate(['/app/dashboard']);
  }
}
