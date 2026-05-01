import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { interval, startWith, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiError } from '@core/http/api-error.model';
import { AuthService } from '@core/services/auth.service';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { AvatarComponent } from '@shared/ui/avatar/avatar.component';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ToastService } from '@shared/services/toast.service';
import { MensajeriaService } from '@features/messages/services/mensajeria.service';
import { UsuarioService } from '@features/profile/services/usuario.service';

@Component({
  selector: 'app-inbox-page',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    PageHeaderComponent,
    EmptyStateComponent,
    SpinnerComponent,
    AvatarComponent,
    ButtonComponent,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inbox.page.html',
  styleUrl: './inbox.page.scss',
})
export class InboxPage implements OnInit {
  private readonly service = inject(MensajeriaService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly conversaciones = this.service.conversaciones;

  // Panel "Nuevo mensaje"
  readonly showNew = signal(false);
  readonly newUsername = signal('');
  readonly starting = signal(false);

  ngOnInit(): void {
    // Carga inicial inmediata + polling 30s mientras la página esté montada.
    // takeUntilDestroyed se pasa con el DestroyRef ya inyectado en el field
    // (llamar inject() dentro del pipe daba problemas fuera de injection context).
    interval(30_000)
      .pipe(
        startWith(0),
        switchMap(() => this.service.listar$()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.loading.set(false),
        error: (err: ApiError) => {
          this.loading.set(false);
          if (err.status !== 404) this.toast.error(err.message ?? 'Error al cargar mensajes');
        },
      });
  }

  toggleNew(): void {
    this.showNew.update((v) => !v);
    if (this.showNew()) this.newUsername.set('');
  }

  onUsernameChange(value: string): void {
    this.newUsername.set(value);
  }

  /**
   * Resuelve el username a un usuario y abre/crea la conversación con él. El
   * backend devuelve la conversación existente o crea una nueva; navegamos al
   * detalle inmediatamente.
   */
  startConversation(): void {
    const username = this.newUsername().trim();
    if (!username) return;
    const me = this.auth.currentUser();
    if (me && username.toLowerCase() === me.username.toLowerCase()) {
      this.toast.error('No puedes iniciar una conversación contigo mismo');
      return;
    }
    this.starting.set(true);
    this.usuarioService.buscarPorUsername$(username).subscribe({
      next: (user) => {
        this.service.buscarOCrear$({ destinatarioId: user.id }).subscribe({
          next: (conv) => {
            this.starting.set(false);
            this.showNew.set(false);
            this.newUsername.set('');
            this.router.navigate(['/app/messages', conv.id]);
          },
          error: (err: ApiError) => {
            this.starting.set(false);
            this.toast.error(err.message ?? 'No se pudo abrir la conversación');
          },
        });
      },
      error: (err: ApiError) => {
        this.starting.set(false);
        this.toast.error(
          err.status === 404 ? 'No existe ningún usuario con ese nombre' : (err.message ?? 'Error buscando usuario'),
        );
      },
    });
  }
}
