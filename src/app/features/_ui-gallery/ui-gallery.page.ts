import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent, IconName } from '@shared/ui/icon/icon.component';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { TagComponent } from '@shared/ui/tag/tag.component';
import { StatusDotComponent } from '@shared/ui/status-dot/status-dot.component';
import { TeamCrestComponent } from '@shared/ui/team-crest/team-crest.component';
import { TabsComponent, TabOption } from '@shared/ui/tabs/tabs.component';
import { AvatarComponent } from '@shared/ui/avatar/avatar.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PositionPillComponent } from '@shared/ui/position-pill/position-pill.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { NotchCardComponent } from '@shared/molecules/notch-card/notch-card.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { StatusTagComponent } from '@shared/molecules/status-tag/status-tag.component';
import { TeamPairComponent } from '@shared/molecules/team-pair/team-pair.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { MatchRowComponent } from '@shared/molecules/match-row/match-row.component';
import { SearchBarComponent } from '@shared/molecules/search-bar/search-bar.component';
import { ToastHostComponent } from '@shared/molecules/toast-host/toast-host.component';
import { ConfirmDialogComponent } from '@shared/molecules/confirm-dialog/confirm-dialog.component';
import { CompetitionCardComponent } from '@shared/components/competition-card/competition-card.component';
import { TeamCardComponent } from '@shared/components/team-card/team-card.component';
import { InvitationCardComponent } from '@shared/components/invitation-card/invitation-card.component';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { ColumnDef } from '@shared/components/data-table/data-table.types';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import {
  Competicion,
  EstadoCompeticion,
  FormatoCompeticion,
} from '@core/models/competicion/competicion.model';
import { Equipo } from '@core/models/equipo/equipo.model';
import { Evento, EstadoEvento } from '@core/models/evento/evento.model';
import { EstadoInvitacion, Invitacion } from '@core/models/invitacion/invitacion.model';
import { RolCompeticion } from '@core/models/rol';

interface StandingRow extends Record<string, unknown> {
  readonly pos: number;
  readonly team: string;
  readonly pj: number;
  readonly g: number;
  readonly e: number;
  readonly p: number;
  readonly pts: number;
}

@Component({
  selector: 'app-ui-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IconComponent,
    ButtonComponent,
    TagComponent,
    StatusDotComponent,
    TeamCrestComponent,
    TabsComponent,
    AvatarComponent,
    SpinnerComponent,
    PositionPillComponent,
    PageHeaderComponent,
    NotchCardComponent,
    EmptyStateComponent,
    StatusTagComponent,
    TeamPairComponent,
    FormFieldComponent,
    MatchRowComponent,
    SearchBarComponent,
    ToastHostComponent,
    ConfirmDialogComponent,
    CompetitionCardComponent,
    TeamCardComponent,
    InvitationCardComponent,
    DataTableComponent,
  ],
  templateUrl: './ui-gallery.page.html',
  styleUrl: './ui-gallery.page.scss',
})
export class UiGalleryPage {
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly icons: readonly IconName[] = [
    'bell', 'mail', 'user', 'calendar', 'chat', 'plus', 'chev-r', 'chev-l', 'chev-d',
    'search', 'filter', 'trophy', 'users', 'shield', 'whistle', 'edit', 'logout',
    'settings', 'pin', 'clock', 'check', 'x', 'inbox', 'trash', 'dots', 'upload',
    'stats', 'flag',
  ];

  readonly tabOptions: readonly TabOption[] = [
    { label: 'Partidos', value: 'matches' },
    { label: 'Clasificación', value: 'standings' },
    { label: 'Equipos', value: 'teams' },
    { label: 'Estadísticas', value: 'stats' },
  ];

  readonly activeTab = signal<string>('matches');
  readonly searchValue = signal<string>('');

  private readonly fb = new FormBuilder();
  readonly demoForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly demoCompetition: Competicion = {
    id: 1,
    nombre: 'Liga Corazonistas 25/26',
    descripcion: 'Liga veterana mixta con 12 equipos a doble vuelta.',
    deporteId: 1,
    deporteNombre: 'Fútbol 7',
    creadorId: 1,
    creadorUsername: '@alberto.m',
    publica: true,
    inscripcionAbierta: false,
    estadisticasActivas: true,
    estado: EstadoCompeticion.ACTIVA,
    fechaCreacion: '2025-09-01T10:00:00Z',
    numEquipos: 12,
    configuracion: {
      puntosVictoria: 3, puntosEmpate: 1, puntosDerrota: 0,
      formato: FormatoCompeticion.LIGA_IDA_VUELTA,
      numEquiposPlayoff: 4, partidosEliminatoria: 1,
    },
  };

  readonly demoTeam: Equipo = {
    id: 1,
    nombre: 'Nottingham miedo',
    descripcion: 'Veteranos mixta, 14 en plantilla.',
    publico: true,
    fechaCreacion: '2024-09-12T12:00:00Z',
    numJugadores: 14,
  };

  readonly demoMatch: Evento = {
    id: 1, competicionId: 1, competicionNombre: 'Liga Corazonistas', jornada: 14,
    fechaHora: '2026-04-25T20:30:00', lugar: 'La Granja CDM',
    estado: EstadoEvento.PROGRAMADO, fechaCreacion: '2026-03-01T10:00:00',
    equipoLocal: { id: 1, nombre: 'Nottingham miedo' },
    equipoVisitante: { id: 2, nombre: 'Guacamayos FC' },
  };

  readonly demoInvitation: Invitacion = {
    id: 1, estado: EstadoInvitacion.PENDIENTE, rolOfrecido: RolCompeticion.ARBITRO,
    emisorId: 2, emisorUsername: 'rubenc', destinatarioId: 1, destinatarioUsername: 'alberto.m',
    competicionId: 2, competicionNombre: 'Torneo Primavera CDM',
    fechaCreacion: '2026-04-20T18:00:00Z',
  };

  readonly standings: readonly StandingRow[] = [
    { pos: 1, team: 'Solteros UD', pj: 13, g: 11, e: 1, p: 1, pts: 34 },
    { pos: 2, team: 'La Granja', pj: 13, g: 8, e: 3, p: 2, pts: 27 },
    { pos: 3, team: 'Nottingham miedo', pj: 13, g: 8, e: 2, p: 3, pts: 26 },
    { pos: 4, team: 'Corazonistas Ofis', pj: 13, g: 6, e: 4, p: 3, pts: 22 },
    { pos: 5, team: 'Guacamayos FC', pj: 13, g: 6, e: 3, p: 4, pts: 21 },
  ];

  readonly standingRowClass = (_row: StandingRow, index: number, total: number): string | null => {
    if (index === 0) return 'row-leader';
    if (index === total - 1) return 'row-relegated';
    return null;
  };

  readonly standingColumns: readonly ColumnDef<StandingRow>[] = [
    { key: 'pos', label: '#', width: '60px', align: 'center' },
    { key: 'team', label: 'Equipo' },
    { key: 'pj', label: 'PJ', width: '60px', align: 'center' },
    { key: 'g', label: 'G', width: '60px', align: 'center' },
    { key: 'e', label: 'E', width: '60px', align: 'center' },
    { key: 'p', label: 'P', width: '60px', align: 'center' },
    { key: 'pts', label: 'Pts', width: '80px', align: 'end' },
  ];

  showSuccess(): void {
    this.toast.success('Competición creada correctamente');
  }

  showError(): void {
    this.toast.error('No se pudo conectar con el servidor');
  }

  async askDelete(): Promise<void> {
    const ok = await this.confirm.ask({
      title: '¿Eliminar competición?',
      message: 'Esta acción no se puede deshacer. Se eliminarán todos los partidos y estadísticas asociadas.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) {
      this.toast.success('Competición eliminada');
    } else {
      this.toast.info('Operación cancelada');
    }
  }
}
