import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { ToastService } from '@shared/services/toast.service';
import { CalendarioService } from '@features/events/services/calendario.service';

type Mode = 'league' | 'playoff';

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
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly competicionId = signal<number | null>(null);
  readonly mode = signal<Mode>('league');
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    fechaInicio: ['', [Validators.required]],
    diasJornada: [7, [Validators.required, Validators.min(1)]],
    rondaInicial: [null as number | null],
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('competicionId'));
      if (Number.isFinite(id)) this.competicionId.set(id);
    });
  }

  setMode(m: Mode): void {
    this.mode.set(m);
  }

  generate(): void {
    const compId = this.competicionId();
    if (compId == null) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { fechaInicio, diasJornada, rondaInicial } = this.form.getRawValue();
    const req = { fechaInicio, diasJornada };

    this.saving.set(true);
    const obs =
      this.mode() === 'playoff'
        ? this.service.generarPlayoff$(compId, req, rondaInicial ?? undefined)
        : this.service.generar$(compId, req);

    obs.subscribe({
      next: (eventos) => {
        this.saving.set(false);
        this.toast.success(`Calendario generado · ${eventos.length} partidos`);
        this.router.navigate(['/competitions', compId]);
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.toast.error(err.message ?? 'No se pudo generar el calendario');
      },
    });
  }

  cancel(): void {
    const compId = this.competicionId();
    if (compId != null) this.router.navigate(['/competitions', compId]);
    else this.router.navigate(['/competitions']);
  }
}
