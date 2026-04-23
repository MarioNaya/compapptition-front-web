import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TipoEquipo } from '@core/models/equipo/equipo.model';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { ImageUploadComponent } from '@shared/organisms/image-upload/image-upload.component';
import { ToastService } from '@shared/services/toast.service';
import { EquipoService } from '@features/teams/services/equipo.service';

@Component({
  selector: 'app-new-team-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    SpinnerComponent,
    PageHeaderComponent,
    FormFieldComponent,
    ImageUploadComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-team.page.html',
  styleUrl: './new-team.page.scss',
})
export class NewTeamPage {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EquipoService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
    descripcion: [''],
    tipo: [TipoEquipo.GESTIONADO, [Validators.required]],
    escudoUrl: ['', [Validators.maxLength(512)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const { nombre, descripcion, tipo, escudoUrl } = this.form.getRawValue();
    this.service
      .create$({
        nombre,
        descripcion: descripcion || undefined,
        tipo,
        escudoUrl: escudoUrl || undefined,
      })
      .subscribe({
        next: (equipo) => {
          this.toast.success('Equipo creado');
          this.router.navigate(['/app/teams', equipo.id]);
        },
        error: (err: ApiError) => {
          this.loading.set(false);
          this.toast.error(err.message ?? 'No se pudo crear el equipo');
        },
      });
  }

  onEscudoUploaded(url: string): void {
    this.form.controls.escudoUrl.setValue(url);
  }

  onEscudoCleared(): void {
    this.form.controls.escudoUrl.setValue('');
  }

  cancel(): void {
    this.router.navigate(['/app/dashboard']);
  }
}
