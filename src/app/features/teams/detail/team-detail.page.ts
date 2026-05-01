import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  TemplateRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Equipo } from '@core/models/equipo/equipo.model';
import { Jugador } from '@core/models/equipo/jugador.model';
import { ApiError } from '@core/http/api-error.model';
import { AuthService } from '@core/services/auth.service';
import { RolCompeticion } from '@core/models/rol';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { TeamCrestComponent } from '@shared/ui/team-crest/team-crest.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { ColumnDef } from '@shared/components/data-table/data-table.types';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { EquipoService } from '@features/teams/services/equipo.service';
import { InvitacionService } from '@features/invitations/services/invitacion.service';

type AddMode = 'create' | 'invite';

@Component({
  selector: 'app-team-detail-page',
  standalone: true,
  imports: [
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    TeamCrestComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    DataTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-detail.page.html',
  styleUrl: './team-detail.page.scss',
})
export class TeamDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(EquipoService);
  private readonly invitacionService = inject(InvitacionService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly actionsCell = viewChild<TemplateRef<{ $implicit: Jugador; value: unknown }>>('actionsCell');
  readonly dorsalCell = viewChild<TemplateRef<{ $implicit: Jugador; value: unknown }>>('dorsalCell');

  /** ID del jugador cuyo dorsal está en modo edición; null = ninguno. */
  readonly editingDorsalId = signal<number | null>(null);
  /** Valor temporal del input de dorsal mientras se edita. */
  readonly dorsalDraft = signal<number | null>(null);
  /** ID del jugador con guardado en curso (deshabilita el input). */
  readonly savingDorsalId = signal<number | null>(null);

  constructor() {
    // El template `#actionsCell` vive dentro del bloque `@else if (equipo(); as e)`,
    // así que solo aparece cuando el equipo se carga. Reaccionamos cuando el viewChild
    // pasa de undefined a definido para añadir la columna "Acciones" a la DataTable.
    effect(() => {
      const tpl = this.actionsCell();
      if (!tpl) return;
      // Solo añadimos la columna "Acciones" (botón dar de baja) cuando el usuario
      // puede gestionar el equipo. Si no, la tabla queda en modo solo lectura.
      if (!this.canManage()) {
        this.columns.update((cols) => cols.filter((c) => c.key !== 'acciones'));
        return;
      }
      this.columns.update((cols) => {
        if (cols.some((c) => c.key === 'acciones')) return cols;
        return [
          ...cols,
          { key: 'acciones', label: '', width: '70px', align: 'end', cellTemplate: tpl },
        ];
      });
    });

    // Cuando el viewChild del dorsalCell esté listo y se pueda gestionar,
    // sustituimos la columna #/dorsal por la versión editable inline.
    effect(() => {
      const tpl = this.dorsalCell();
      if (!tpl) return;
      const editable = this.canManage();
      this.columns.update((cols) =>
        cols.map((c) => {
          if (c.key !== 'dorsal') return c;
          return editable
            ? { ...c, cellTemplate: tpl }
            : { ...c, cellTemplate: undefined, accessor: (j: Jugador) => j.dorsal ?? '—' };
        }),
      );
    });
  }

  readonly loading = signal(true);
  readonly equipo = signal<Equipo | null>(null);
  readonly jugadores = signal<readonly Jugador[]>([]);
  readonly removingId = signal<number | null>(null);

  /**
   * Mostramos los botones de gestión a quien claramente puede tocar el equipo:
   * el creador y el admin del sistema. Managers y admins de competición tienen
   * permiso real (lo concede el backend), pero como no tenemos en el DTO la
   * lista de competiciones del equipo, evitamos mostrar el botón para no dar
   * falsa expectativa. La acción canalizada vía competition-detail siempre
   * está disponible.
   */
  readonly canManage = computed(() => {
    const e = this.equipo();
    if (!e) return false;
    if (this.auth.isAdminSistema()) return true;
    const u = this.auth.currentUser();
    return !!u && e.creadorId === u.id;
  });

  // Panel "Añadir jugador" — modo y estado
  readonly showAdd = signal(false);
  readonly mode = signal<AddMode>('create');
  readonly busy = signal(false);

  // Crear jugador fantasma
  readonly nuevoNombre = signal('');
  readonly nuevoApellidos = signal('');
  readonly nuevoPosicion = signal('');
  readonly nuevoDorsal = signal<number | null>(null);

  // Invitar
  readonly invitarEmail = signal('');
  readonly invitarUsername = signal('');

  readonly columns = signal<readonly ColumnDef<Jugador>[]>([
    {
      key: 'dorsal',
      label: '#',
      width: '70px',
      align: 'center',
      accessor: (j) => j.dorsal ?? '—',
    },
    {
      key: 'nombre',
      label: 'Jugador',
      accessor: (j) => `${j.nombre}${j.apellidos ? ' ' + j.apellidos : ''}`,
    },
    { key: 'posicion', label: 'Posición', width: '140px' },
    { key: 'altura', label: 'Altura', width: '100px', align: 'center' },
    { key: 'peso', label: 'Peso', width: '100px', align: 'center' },
  ]);

  readonly rowKey = (j: Jugador) => j.id;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('id'));
      if (Number.isFinite(id)) this.load(id);
    });
  }

  private load(id: number): void {
    this.loading.set(true);
    forkJoin({
      equipo: this.service.findById$(id),
      jugadores: this.service.findJugadores$(id),
    }).subscribe({
      next: ({ equipo, jugadores }) => {
        this.equipo.set(equipo);
        this.jugadores.set(jugadores);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'Error al cargar el equipo');
        this.loading.set(false);
      },
    });
  }

  /**
   * Copia el código de invitación al portapapeles. Si el navegador no soporta
   * Clipboard API caemos a una notificación informativa.
   */
  async copiarCodigo(): Promise<void> {
    const e = this.equipo();
    if (!e?.codigoInvitacion) return;
    try {
      await navigator.clipboard.writeText(e.codigoInvitacion);
      this.toast.success('Código copiado al portapapeles');
    } catch {
      this.toast.error('No se pudo copiar el código; selecciónalo manualmente');
    }
  }

  /**
   * Pregunta confirmación e invalida el código de invitación actual emitiendo
   * uno nuevo. Útil si se ha filtrado el código.
   */
  async regenerarCodigo(): Promise<void> {
    const e = this.equipo();
    if (!e || e.publico) return;
    const ok = await this.confirm.ask({
      title: '¿Regenerar código?',
      message: 'El código actual dejará de ser válido inmediatamente. Tendrás que compartir el nuevo código a quien quieras que invite a este equipo.',
      confirmLabel: 'Regenerar',
      destructive: true,
    });
    if (!ok) return;
    this.service.regenerarCodigo$(e.id).subscribe({
      next: (equipo) => {
        this.equipo.set(equipo);
        this.toast.success('Código regenerado');
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo regenerar el código'),
    });
  }

  openJugador(j: Jugador): void {
    this.router.navigate(['/app/players', j.id]);
  }

  /** Entra en modo edición del dorsal de un jugador. */
  startEditDorsal(j: Jugador, ev?: Event): void {
    if (ev) ev.stopPropagation();
    this.editingDorsalId.set(j.id);
    this.dorsalDraft.set(j.dorsal ?? null);
  }

  cancelEditDorsal(ev?: Event): void {
    if (ev) ev.stopPropagation();
    this.editingDorsalId.set(null);
    this.dorsalDraft.set(null);
  }

  onDorsalDraftChange(value: string): void {
    const n = Number(value);
    this.dorsalDraft.set(value === '' ? null : Number.isFinite(n) && n >= 0 ? Math.floor(n) : null);
  }

  /** Persiste el dorsal en backend si ha cambiado; recarga la plantilla al terminar. */
  saveDorsal(j: Jugador, ev?: Event): void {
    if (ev) ev.stopPropagation();
    const e = this.equipo();
    if (!e) return;
    const nuevo = this.dorsalDraft();
    if (nuevo === (j.dorsal ?? null)) {
      this.cancelEditDorsal();
      return;
    }
    this.savingDorsalId.set(j.id);
    this.service.actualizarDorsal$(e.id, j.id, nuevo).subscribe({
      next: () => {
        this.savingDorsalId.set(null);
        this.editingDorsalId.set(null);
        this.dorsalDraft.set(null);
        this.toast.success('Dorsal actualizado');
        this.load(e.id);
      },
      error: (err: ApiError) => {
        this.savingDorsalId.set(null);
        this.toast.error(err.message ?? 'No se pudo actualizar el dorsal');
      },
    });
  }

  async quitarJugador(j: Jugador, ev?: Event): Promise<void> {
    if (ev) ev.stopPropagation();
    const e = this.equipo();
    if (!e) return;
    const ok = await this.confirm.ask({
      title: '¿Dar de baja al jugador?',
      message: `${j.nombre}${j.apellidos ? ' ' + j.apellidos : ''} dejará de pertenecer a "${e.nombre}". El jugador no se elimina del sistema; solo deja de estar en esta plantilla.`,
      confirmLabel: 'Dar de baja',
      destructive: true,
    });
    if (!ok) return;
    this.removingId.set(j.id);
    this.service.eliminarJugador$(e.id, j.id).subscribe({
      next: () => {
        this.toast.success('Jugador retirado de la plantilla');
        this.removingId.set(null);
        this.load(e.id);
      },
      error: (err: ApiError) => {
        this.removingId.set(null);
        this.toast.error(err.message ?? 'No se pudo retirar al jugador');
      },
    });
  }

  goEdit(): void {
    const e = this.equipo();
    if (!e) return;
    this.router.navigate(['/app/teams', e.id, 'edit']);
  }

  toggleAdd(): void {
    this.showAdd.update((v) => !v);
    if (this.showAdd()) {
      this.resetPanel();
    }
  }

  setMode(m: AddMode): void {
    this.mode.set(m);
  }

  isModeAvailable(_m: AddMode): boolean {
    // Tras eliminar la distinción GESTIONADO/ESTANDAR, ambos modos están
    // disponibles para cualquier equipo.
    return true;
  }

  onCrearNombre(v: string): void { this.nuevoNombre.set(v); }
  onCrearApellidos(v: string): void { this.nuevoApellidos.set(v); }
  onCrearPosicion(v: string): void { this.nuevoPosicion.set(v); }
  onCrearDorsal(v: string): void {
    const n = Number(v);
    this.nuevoDorsal.set(Number.isFinite(n) && n > 0 ? n : null);
  }

  onInvitarEmail(v: string): void { this.invitarEmail.set(v); }
  onInvitarUsername(v: string): void { this.invitarUsername.set(v); }

  crearFantasma(): void {
    const e = this.equipo();
    const nombre = this.nuevoNombre().trim();
    if (!e || !nombre) return;
    this.busy.set(true);
    this.service
      .crearJugadorFantasma$(
        e.id,
        {
          nombre,
          apellidos: this.nuevoApellidos().trim() || undefined,
          posicion: this.nuevoPosicion().trim() || undefined,
          dorsal: this.nuevoDorsal() ?? undefined,
        },
        this.nuevoDorsal() ?? undefined,
      )
      .subscribe({
        next: (jugador) => {
          this.toast.success(`${jugador.nombre} añadido a la plantilla`);
          this.busy.set(false);
          this.showAdd.set(false);
          this.resetPanel();
          this.load(e.id);
        },
        error: (err: ApiError) => {
          this.busy.set(false);
          this.toast.error(err.message ?? 'No se pudo crear el jugador');
        },
      });
  }

  invitar(): void {
    const e = this.equipo();
    if (!e) return;
    const email = this.invitarEmail().trim();
    const username = this.invitarUsername().trim();
    if (!email && !username) {
      this.toast.error('Indica un email o un nombre de usuario');
      return;
    }
    this.busy.set(true);
    this.invitacionService
      .create$({
        destinatarioEmail: email || undefined,
        destinatarioUsername: username || undefined,
        equipoId: e.id,
        rolOfrecido: RolCompeticion.JUGADOR,
      })
      .subscribe({
        next: () => {
          this.toast.success('Invitación enviada');
          this.busy.set(false);
          this.showAdd.set(false);
          this.resetPanel();
        },
        error: (err: ApiError) => {
          this.busy.set(false);
          this.toast.error(err.message ?? 'No se pudo enviar la invitación');
        },
      });
  }

  private resetPanel(): void {
    this.nuevoNombre.set('');
    this.nuevoApellidos.set('');
    this.nuevoPosicion.set('');
    this.nuevoDorsal.set(null);
    this.invitarEmail.set('');
    this.invitarUsername.set('');
    this.mode.set('create');
  }

  async askDelete(): Promise<void> {
    const e = this.equipo();
    if (!e) return;
    const ok = await this.confirm.ask({
      title: '¿Eliminar equipo?',
      message: `"${e.nombre}" se eliminará junto con sus jugadores. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    this.service.delete$(e.id).subscribe({
      next: () => {
        this.toast.success('Equipo eliminado');
        this.router.navigate(['/app/dashboard']);
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo eliminar'),
    });
  }
}
