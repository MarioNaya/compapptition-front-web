import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Equipo } from '@core/models/equipo/equipo.model';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { ToastService } from '@shared/services/toast.service';
import { EventoService } from '@features/events/services/evento.service';
import { EquipoService } from '@features/teams/services/equipo.service';

@Component({
  selector: 'app-new-event-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    SpinnerComponent,
    PageHeaderComponent,
    FormFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-event.page.html',
  styleUrl: './new-event.page.scss',
})
export class NewEventPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly eventoService = inject(EventoService);
  private readonly equipoService = inject(EquipoService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);
  readonly loadingTeams = signal(true);
  readonly equipos = signal<readonly Equipo[]>([]);
  readonly competicionId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    jornada: [1, [Validators.required, Validators.min(1)]],
    fechaHora: ['', [Validators.required]],
    lugar: [''],
    equipoLocalId: [0, [Validators.required, Validators.min(1)]],
    equipoVisitanteId: [0, [Validators.required, Validators.min(1)]],
    observaciones: [''],
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('competicionId'));
      if (Number.isFinite(id)) {
        this.competicionId.set(id);
        this.loadTeams(id);
      }
    });
  }

  private loadTeams(competicionId: number): void {
    this.loadingTeams.set(true);
    this.equipoService.findByCompeticion$(competicionId).subscribe({
      next: (list) => {
        this.equipos.set(list);
        this.loadingTeams.set(false);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'Error al cargar equipos de la competición');
        this.loadingTeams.set(false);
      },
    });
  }

  submit(): void {
    const compId = this.competicionId();
    if (compId == null) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { jornada, fechaHora, lugar, equipoLocalId, equipoVisitanteId, observaciones } =
      this.form.getRawValue();
    if (equipoLocalId === equipoVisitanteId) {
      this.toast.error('El equipo local y visitante deben ser distintos');
      return;
    }
    this.saving.set(true);
    this.eventoService
      .create$(compId, {
        jornada,
        fechaHora,
        lugar: lugar || undefined,
        equipoLocalId,
        equipoVisitanteId,
        observaciones: observaciones || undefined,
      })
      .subscribe({
        next: (evento) => {
          this.toast.success('Partido creado');
          this.router.navigate(['/competitions', compId, 'events', evento.id]);
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.toast.error(err.message ?? 'No se pudo crear el partido');
        },
      });
  }

  cancel(): void {
    const compId = this.competicionId();
    if (compId != null) this.router.navigate(['/competitions', compId]);
    else this.router.navigate(['/competitions']);
  }
}
