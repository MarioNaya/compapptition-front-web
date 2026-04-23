import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { AvatarComponent } from '@shared/ui/avatar/avatar.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { UsuarioService } from '@features/profile/services/usuario.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    AvatarComponent,
    PageHeaderComponent,
    FormFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly service = inject(UsuarioService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);

  readonly displayName = computed(() => {
    const u = this.user();
    if (!u) return '';
    if (u.nombre) return `${u.nombre}${u.apellidos ? ' ' + u.apellidos : ''}`;
    return u.username;
  });

  readonly profileForm = this.fb.nonNullable.group({
    nombre: [''],
    apellidos: [''],
    email: ['', [Validators.email]],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      passwordActual: ['', [Validators.required]],
      passwordNuevo: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required]],
    },
    { validators: [this.matchValidator] },
  );

  private matchValidator(
    group: { value: { passwordNuevo?: string; confirm?: string } },
  ): ValidationErrors | null {
    const { passwordNuevo, confirm } = group.value;
    return passwordNuevo && confirm && passwordNuevo !== confirm ? { mismatch: true } : null;
  }

  ngOnInit(): void {
    const u = this.user();
    if (u) {
      this.profileForm.patchValue({
        nombre: u.nombre ?? '',
        apellidos: u.apellidos ?? '',
        email: u.email ?? '',
      });
    }
  }

  saveProfile(): void {
    const u = this.user();
    if (!u) return;
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.savingProfile.set(true);
    const { nombre, apellidos, email } = this.profileForm.getRawValue();
    this.service
      .update$(u.id, {
        nombre: nombre || undefined,
        apellidos: apellidos || undefined,
        email: email || undefined,
      })
      .subscribe({
        next: () => {
          this.savingProfile.set(false);
          this.toast.success('Perfil actualizado');
        },
        error: (err: ApiError) => {
          this.savingProfile.set(false);
          this.toast.error(err.message ?? 'No se pudo actualizar');
        },
      });
  }

  savePassword(): void {
    const u = this.user();
    if (!u) return;
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.savingPassword.set(true);
    const { passwordActual, passwordNuevo } = this.passwordForm.getRawValue();
    this.service.cambiarPassword$(u.id, { passwordActual, passwordNuevo }).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordForm.reset();
        this.toast.success('Contraseña actualizada');
      },
      error: (err: ApiError) => {
        this.savingPassword.set(false);
        this.toast.error(err.message ?? 'No se pudo cambiar la contraseña');
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }

  async askDeactivate(): Promise<void> {
    const u = this.user();
    if (!u) return;
    const ok = await this.confirm.ask({
      title: '¿Dar de baja tu cuenta?',
      message: 'Tu cuenta quedará desactivada. No podrás acceder con estas credenciales.',
      confirmLabel: 'Desactivar',
      destructive: true,
    });
    if (!ok) return;
    this.service.desactivar$(u.id).subscribe({
      next: () => {
        this.toast.success('Cuenta desactivada');
        this.auth.logout();
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo desactivar'),
    });
  }
}
