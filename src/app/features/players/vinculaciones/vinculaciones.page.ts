import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ApiError } from '@core/http/api-error.model';
import { AuthService } from '@core/services/auth.service';
import {
  EstadoSolicitudVinculacion,
  SolicitudVinculacion,
} from '@core/models/jugador/solicitud-vinculacion.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { SolicitudVinculacionService } from '@features/players/services/solicitud-vinculacion.service';

@Component({
  selector: 'app-vinculaciones-page',
  standalone: true,
  imports: [
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vinculaciones.page.html',
  styleUrl: './vinculaciones.page.scss',
})
export class VinculacionesPage implements OnInit {
  private readonly service = inject(SolicitudVinculacionService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly loading = signal(true);
  readonly busyId = signal<number | null>(null);
  readonly solicitudes = signal<readonly SolicitudVinculacion[]>([]);

  readonly comoUsuario = computed(() => {
    const myId = this.auth.currentUser()?.id;
    return this.solicitudes().filter(
      (s) => s.estado === EstadoSolicitudVinculacion.PENDIENTE_USUARIO && s.usuarioId === myId,
    );
  });

  readonly comoAdmin = computed(() =>
    this.solicitudes().filter((s) => s.estado === EstadoSolicitudVinculacion.PENDIENTE_ADMIN),
  );

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.pendientes$().subscribe({
      next: (list) => {
        this.solicitudes.set(list);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'Error al cargar solicitudes');
        this.loading.set(false);
      },
    });
  }

  async aceptar(s: SolicitudVinculacion): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Confirmar vinculación',
      message: this.mensajeConfirmacion(s, true),
      confirmLabel: 'Aceptar',
    });
    if (!ok) return;
    this.busyId.set(s.id);
    this.service.aceptar$(s.id).subscribe({
      next: () => {
        this.toast.success('Vinculación aceptada');
        this.busyId.set(null);
        this.load();
      },
      error: (err: ApiError) => {
        this.busyId.set(null);
        this.toast.error(err.message ?? 'No se pudo aceptar');
      },
    });
  }

  async rechazar(s: SolicitudVinculacion): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Rechazar vinculación',
      message: this.mensajeConfirmacion(s, false),
      confirmLabel: 'Rechazar',
      destructive: true,
    });
    if (!ok) return;
    this.busyId.set(s.id);
    this.service.rechazar$(s.id).subscribe({
      next: () => {
        this.toast.success('Vinculación rechazada');
        this.busyId.set(null);
        this.load();
      },
      error: (err: ApiError) => {
        this.busyId.set(null);
        this.toast.error(err.message ?? 'No se pudo rechazar');
      },
    });
  }

  jugadorLabel(s: SolicitudVinculacion): string {
    return `${s.jugadorNombre}${s.jugadorApellidos ? ' ' + s.jugadorApellidos : ''}`;
  }

  usuarioLabel(s: SolicitudVinculacion): string {
    return s.usuarioUsername ?? s.usuarioEmail ?? `Usuario #${s.usuarioId}`;
  }

  private mensajeConfirmacion(s: SolicitudVinculacion, aceptar: boolean): string {
    const accion = aceptar ? 'Aceptar' : 'Rechazar';
    if (s.estado === EstadoSolicitudVinculacion.PENDIENTE_USUARIO) {
      return `${accion} vincular tu cuenta al jugador "${this.jugadorLabel(s)}" del equipo "${s.equipoNombre}".`;
    }
    return `${accion} vincular al usuario ${this.usuarioLabel(s)} con el jugador "${this.jugadorLabel(s)}" en "${s.equipoNombre}".`;
  }
}
