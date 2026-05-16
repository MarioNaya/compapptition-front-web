import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import type { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    SpinnerComponent,
    FormFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reset-password.page.html',
  styleUrl: './reset-password.page.scss',
})
export class ResetPasswordPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  ngOnInit(): void {
    // Limpiar el token de la URL una vez capturado en memoria, para evitar
    // que quede en historial del navegador, logs de proxy o referrer
    // outbound al hacer clic en otro enlace (cierra SF-11). El token
    // ya está en `this.token` y se enviará en el body del POST.
    if (this.token) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { token: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [this.matchValidator] },
  );

  private matchValidator(group: { value: { password?: string; confirmPassword?: string } }): ValidationErrors | null {
    const { password, confirmPassword } = group.value;
    return password && confirmPassword && password !== confirmPassword ? { mismatch: true } : null;
  }

  submit(): void {
    if (!this.token) {
      this.toast.error('El enlace de recuperación no es válido. Solicita uno nuevo.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.auth.resetPassword(this.token, this.form.controls.password.value).subscribe({
      next: () => {
        this.toast.success('Contraseña restablecida. Ya puedes iniciar sesión.');
        this.router.navigate(['/auth/login']);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.toast.error(err.message || 'No se pudo restablecer la contraseña');
      },
    });
  }
}
