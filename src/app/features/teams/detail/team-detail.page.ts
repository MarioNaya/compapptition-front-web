import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  TemplateRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Equipo, TipoEquipo } from '@core/models/equipo/equipo.model';
import { Jugador } from '@core/models/equipo/jugador.model';
import { ApiError } from '@core/http/api-error.model';
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
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly actionsCell = viewChild<TemplateRef<{ $implicit: Jugador; value: unknown }>>('actionsCell');

  constructor() {
    // El template `#actionsCell` vive dentro del bloque `@else if (equipo(); as e)`,
    // así que solo aparece cuando el equipo se carga. Reaccionamos cuando el viewChild
    // pasa de undefined a definido para añadir la columna "Acciones" a la DataTable.
    effect(() => {
      const tpl = this.actionsCell();
      if (!tpl) return;
      this.columns.update((cols) => {
        if (cols.some((c) => c.key === 'acciones')) return cols;
        return [
          ...cols,
          { key: 'acciones', label: '', width: '70px', align: 'end', cellTemplate: tpl },
        ];
      });
    });
  }

  readonly loading = signal(true);
  readonly equipo = signal<Equipo | null>(null);
  readonly jugadores = signal<readonly Jugador[]>([]);
  readonly removingId = signal<number | null>(null);

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
        // Si el equipo es GESTIONADO, no se permite crear fantasma — forzamos modo invitar.
        if (equipo.tipo === TipoEquipo.GESTIONADO) this.mode.set('invite');
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'Error al cargar el equipo');
        this.loading.set(false);
      },
    });
  }

  openJugador(j: Jugador): void {
    this.router.navigate(['/app/players', j.id]);
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

  isModeAvailable(m: AddMode): boolean {
    if (m === 'create') {
      const e = this.equipo();
      return !!e && e.tipo === TipoEquipo.ESTANDAR;
    }
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
    const e = this.equipo();
    this.mode.set(e && e.tipo === TipoEquipo.GESTIONADO ? 'invite' : 'create');
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
