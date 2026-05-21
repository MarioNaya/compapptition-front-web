import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import type { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { ToastService } from '@shared/services/toast.service';
import { passwordRequirementsValidator } from '@shared/validators/password-requirements.validator';
import { applyServerErrors } from '@shared/forms/apply-server-errors';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    SpinnerComponent,
    FormFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required, passwordRequirementsValidator]],
    nombre: ['', [Validators.maxLength(100)]],
    apellidos: ['', [Validators.maxLength(100)]],
    // Aceptación legal obligatoria (RGPD/LSSI). Sin marcarla no se envía el
    // formulario. La verificación adicional en submit() es defensa en
    // profundidad: el botón ya queda deshabilitado mientras esté sin marcar.
    aceptaLegal: [false, [Validators.requiredTrue]],
    // Honeypot anti-bot (cierra SF-14 parcial). Campo oculto a usuarios humanos
    // por CSS. Los bots que rellenan formularios automáticos sí lo poblarán.
    // Si llega no vacío, abortamos sin avisar (parecemos éxito desde fuera).
    hpField: [''],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Honeypot check (SF-14): si un bot rellenó el campo invisible, simulamos
    // éxito para no darle señal de detección. El registro NO se ejecuta.
    if (this.form.controls.hpField.value) {
      this.toast.success('Cuenta creada. ¡Bienvenido!');
      return;
    }
    this.loading.set(true);
    const {
      nombre,
      apellidos,
      hpField: _hp,
      aceptaLegal: _ack,
      ...rest
    } = this.form.getRawValue();
    const payload = {
      ...rest,
      nombre: nombre || undefined,
      apellidos: apellidos || undefined,
    };
    this.auth.registro(payload).subscribe({
      next: () => {
        this.toast.success('Cuenta creada. ¡Bienvenido!');
        this.router.navigateByUrl('/app/dashboard');
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        const mappedToField = applyServerErrors(this.form, err);
        if (!mappedToField) {
          this.toast.error(err.message || 'No se pudo completar el registro');
        }
      },
    });
  }
}
