import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Equipo } from '@core/models/equipo/equipo.model';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { ImageUploadComponent } from '@shared/organisms/image-upload/image-upload.component';
import { ToastService } from '@shared/services/toast.service';
import { EquipoService } from '@features/teams/services/equipo.service';

@Component({
  selector: 'app-edit-team-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    SpinnerComponent,
    PageHeaderComponent,
    FormFieldComponent,
    EmptyStateComponent,
    ImageUploadComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-team.page.html',
  styleUrl: './edit-team.page.scss',
})
export class EditTeamPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EquipoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly equipo = signal<Equipo | null>(null);
  readonly notFound = signal(false);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
    descripcion: [''],
    escudoUrl: ['', [Validators.maxLength(512)]],
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('id'));
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
    this.service.findById$(id).subscribe({
      next: (e) => {
        this.equipo.set(e);
        this.form.patchValue({
          nombre: e.nombre,
          descripcion: e.descripcion ?? '',
          escudoUrl: e.escudoUrl ?? '',
        });
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        if (err.status === 404) this.notFound.set(true);
        else this.toast.error(err.message ?? 'Error al cargar el equipo');
      },
    });
  }

  onEscudoUploaded(url: string): void {
    this.form.controls.escudoUrl.setValue(url);
    this.form.controls.escudoUrl.markAsDirty();
  }

  onEscudoCleared(): void {
    this.form.controls.escudoUrl.setValue('');
    this.form.controls.escudoUrl.markAsDirty();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const e = this.equipo();
    if (!e) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.service
      .update$(e.id, {
        nombre: v.nombre,
        descripcion: v.descripcion || undefined,
        escudoUrl: v.escudoUrl || undefined,
      })
      .subscribe({
        next: () => {
          this.toast.success('Equipo actualizado');
          this.router.navigate(['/app/teams', e.id]);
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          this.toast.error(err.message ?? 'No se pudo actualizar');
        },
      });
  }

  cancel(): void {
    const e = this.equipo();
    if (e) this.router.navigate(['/app/teams', e.id]);
    else this.router.navigate(['/app/dashboard']);
  }
}
