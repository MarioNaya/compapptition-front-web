import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/services/auth.service';
import { ApiError } from '@core/http/api-error.model';
import { Equipo, TipoEquipo } from '@core/models/equipo/equipo.model';
import { EstadoCompeticion } from '@core/models/competicion/competicion.model';
import { RolCompeticion } from '@core/models/rol';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { TeamCrestComponent } from '@shared/ui/team-crest/team-crest.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { SearchBarComponent } from '@shared/molecules/search-bar/search-bar.component';
import { TeamCardComponent } from '@shared/components/team-card/team-card.component';
import { ToastService } from '@shared/services/toast.service';
import { EquipoService } from '@features/teams/services/equipo.service';
import { InvitacionService } from '@features/invitations/services/invitacion.service';

@Component({
  selector: 'app-teams-tab',
  standalone: true,
  imports: [
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    TeamCrestComponent,
    EmptyStateComponent,
    SearchBarComponent,
    TeamCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teams-tab.component.html',
  styleUrl: './teams-tab.component.scss',
})
export class TeamsTabComponent implements OnInit {
  private readonly service = inject(EquipoService);
  private readonly invitacionService = inject(InvitacionService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  readonly competicionId = input.required<number>();
  readonly estado = input.required<EstadoCompeticion>();

  readonly loading = signal(true);
  readonly equipos = signal<readonly Equipo[]>([]);
  readonly showInvite = signal(false);
  readonly showCreate = signal(false);

  // búsqueda + invitación
  readonly searchTerm = signal('');
  readonly searching = signal(false);
  readonly searchResults = signal<readonly Equipo[]>([]);
  readonly selectedEquipo = signal<Equipo | null>(null);
  readonly managerEmail = signal('');
  readonly sending = signal(false);

  // creación inline
  readonly newTeamName = signal('');
  readonly creating = signal(false);

  readonly canAddTeam = computed(() => this.estado() === EstadoCompeticion.BORRADOR);

  readonly availableResults = computed(() => {
    const inscritosIds = new Set(this.equipos().map((e) => e.id));
    return this.searchResults().filter((e) => !inscritosIds.has(e.id));
  });

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          this.searching.set(true);
          return this.service.findAll$({ search: term, size: 20 });
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (page) => {
          this.searchResults.set(page.content);
          this.searching.set(false);
        },
        error: () => {
          this.searchResults.set([]);
          this.searching.set(false);
        },
      });
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.findByCompeticion$(this.competicionId()).subscribe({
      next: (list) => {
        this.equipos.set(list);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'Error al cargar equipos');
        this.loading.set(false);
      },
    });
  }

  toggleInvite(): void {
    this.showCreate.set(false);
    this.showInvite.update((v) => !v);
    if (this.showInvite()) {
      this.searchTerm.set('');
      this.selectedEquipo.set(null);
      this.managerEmail.set('');
      this.searchSubject.next('');
    }
  }

  toggleCreate(): void {
    this.showInvite.set(false);
    this.showCreate.update((v) => !v);
    if (!this.showCreate()) this.newTeamName.set('');
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.searchSubject.next(value);
  }

  onEmailChange(value: string): void {
    this.managerEmail.set(value);
  }

  selectTeam(equipo: Equipo): void {
    this.selectedEquipo.set(equipo);
    this.managerEmail.set('');
  }

  backToSearch(): void {
    this.selectedEquipo.set(null);
    this.managerEmail.set('');
  }

  sendInvitation(): void {
    const equipo = this.selectedEquipo();
    const email = this.managerEmail().trim();
    const userId = this.auth.currentUser()?.id;
    if (!equipo || !email || !userId) return;

    this.sending.set(true);
    this.invitacionService
      .create$(
        {
          destinatarioEmail: email,
          competicionId: this.competicionId(),
          equipoId: equipo.id,
          rolOfrecido: RolCompeticion.MANAGER_EQUIPO,
        },
        userId,
      )
      .subscribe({
        next: () => {
          this.toast.success(`Invitación enviada a ${email} para "${equipo.nombre}"`);
          this.sending.set(false);
          this.showInvite.set(false);
          this.selectedEquipo.set(null);
          this.managerEmail.set('');
        },
        error: (err: ApiError) => {
          this.sending.set(false);
          this.toast.error(err.message ?? 'No se pudo enviar la invitación');
        },
      });
  }

  onNameChange(value: string): void {
    this.newTeamName.set(value);
  }

  /**
   * Flujo alternativo: el creador de la competición puede crear un equipo propio
   * e inscribirlo directamente (sin invitación) usando `inscribirEnCompeticion$`.
   */
  createAndEnroll(): void {
    const userId = this.auth.currentUser()?.id;
    const nombre = this.newTeamName().trim();
    if (!userId || !nombre) return;

    this.creating.set(true);
    this.service.create$({ nombre, tipo: TipoEquipo.GESTIONADO }).subscribe({
      next: (equipo) => {
        this.service
          .inscribirEnCompeticion$(this.competicionId(), equipo.id, userId)
          .subscribe({
            next: () => {
              this.toast.success(`"${equipo.nombre}" creado e inscrito`);
              this.creating.set(false);
              this.showCreate.set(false);
              this.newTeamName.set('');
              this.load();
            },
            error: (err: ApiError) => {
              this.creating.set(false);
              this.toast.error(err.message ?? 'Equipo creado pero no se pudo inscribir');
            },
          });
      },
      error: (err: ApiError) => {
        this.creating.set(false);
        this.toast.error(err.message ?? 'No se pudo crear el equipo');
      },
    });
  }

  openTeam(equipo: Equipo): void {
    this.router.navigate(['/teams', equipo.id]);
  }
}
