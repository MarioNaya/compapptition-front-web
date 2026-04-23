import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Evento, EstadoEvento } from '@core/models/evento/evento.model';
import { ApiError } from '@core/http/api-error.model';
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './event-detail.page.html',
  styleUrl: './event-detail.page.scss',
})
export class EventDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(EventoService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly evento = signal<Evento | null>(null);
  readonly competicionId = signal<number | null>(null);

  readonly canRegister = computed(() => {
    const e = this.evento();
    return !!e && e.estado !== EstadoEvento.FINALIZADO && e.estado !== EstadoEvento.SUSPENDIDO;
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
    this.service.findById$(competicionId, eventoId).subscribe({
      next: (e) => {
        this.evento.set(e);
        if (e.resultadoLocal != null && e.resultadoVisitante != null) {
          this.resultForm.patchValue({
            resultadoLocal: e.resultadoLocal,
            resultadoVisitante: e.resultadoVisitante,
          });
        }
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'Error al cargar el partido');
        this.loading.set(false);
      },
    });
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
        next: (updated) => {
          this.evento.set(updated);
          this.saving.set(false);
          this.toast.success('Resultado registrado');
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
        this.router.navigate(['/competitions', compId]);
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo eliminar'),
    });
  }
}
