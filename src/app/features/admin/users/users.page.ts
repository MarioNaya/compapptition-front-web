import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Usuario } from '@core/models/usuario/usuario.model';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { AvatarComponent } from '@shared/ui/avatar/avatar.component';
import { TagComponent } from '@shared/ui/tag/tag.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { ToastService } from '@shared/services/toast.service';
import { UsuarioService } from '@features/profile/services/usuario.service';

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    AvatarComponent,
    TagComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    FormFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.page.html',
  styleUrl: './users.page.scss',
})
export class AdminUsersPage {
  private readonly service = inject(UsuarioService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchForm = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
  });

  readonly loading = signal(false);
  readonly usuario = signal<Usuario | null>(null);
  readonly searched = signal(false);

  search(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }
    const username = this.searchForm.controls.username.value.trim();
    if (!username) return;
    this.loading.set(true);
    this.searched.set(true);
    this.service
      .buscarPorUsername$(username)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (u) => {
          this.usuario.set(u);
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.usuario.set(null);
          this.loading.set(false);
          if (err.status === 404) {
            this.toast.info('Usuario no encontrado');
          } else {
            this.toast.error(err.message ?? 'Error al buscar');
          }
        },
      });
  }

  get displayName(): string {
    const u = this.usuario();
    if (!u) return '';
    if (u.nombre) return `${u.nombre}${u.apellidos ? ' ' + u.apellidos : ''}`;
    return u.username;
  }
}
