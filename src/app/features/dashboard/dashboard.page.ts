import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { forkJoin, of, switchMap } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { CompeticionSimple } from '@core/models/competicion/competicion.model';
import { Evento, EstadoEvento } from '@core/models/evento/evento.model';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { NotchCardComponent } from '@shared/molecules/notch-card/notch-card.component';
import { TeamPairComponent } from '@shared/molecules/team-pair/team-pair.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { MatchRowComponent } from '@shared/molecules/match-row/match-row.component';
import { CompetitionCardComponent } from '@shared/components/competition-card/competition-card.component';
import { ToastService } from '@shared/services/toast.service';
import { CompeticionService } from '@features/competitions/services/competicion.service';
import { EventoService } from '@features/events/services/evento.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    DatePipe,
    UpperCasePipe,
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    PageHeaderComponent,
    NotchCardComponent,
    TeamPairComponent,
    EmptyStateComponent,
    MatchRowComponent,
    CompetitionCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly compService = inject(CompeticionService);
  private readonly eventoService = inject(EventoService);
  private readonly toast = inject(ToastService);

  readonly user = this.auth.currentUser;
  readonly loading = signal(true);
  readonly misCompeticiones = signal<readonly CompeticionSimple[]>([]);
  private readonly _todosEventos = signal<readonly Evento[]>([]);

  readonly proximosEventos = computed<readonly Evento[]>(() => {
    const now = Date.now();
    return this._todosEventos()
      .filter((e) => e.estado === EstadoEvento.PROGRAMADO && new Date(e.fechaHora).getTime() > now)
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
      .slice(0, 5);
  });

  readonly nextMatch = computed<Evento | null>(() => this.proximosEventos()[0] ?? null);

  readonly displayName = computed(() => {
    const u = this.user();
    if (!u) return '';
    return u.nombre || u.username;
  });

  ngOnInit(): void {
    const userId = this.user()?.id;
    if (userId == null) return;
    this.loadData(userId);
  }

  private loadData(userId: number): void {
    this.loading.set(true);
    this.compService
      .misParticipadas$(userId)
      .pipe(
        switchMap((comps) => {
          this.misCompeticiones.set(comps);
          if (comps.length === 0) return of([] as Evento[][]);
          return forkJoin(comps.map((c) => this.eventoService.findByCompeticion$(c.id)));
        }),
      )
      .subscribe({
        next: (eventsByComp) => {
          this._todosEventos.set(eventsByComp.flat());
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.loading.set(false);
          if (err.status !== 404) {
            this.toast.error(err.message ?? 'Error al cargar el dashboard');
          }
        },
      });
  }

  openMatch(e: Evento): void {
    this.router.navigate(['/competitions', e.competicionId, 'events', e.id]);
  }

  openCompetition(c: CompeticionSimple): void {
    this.router.navigate(['/competitions', c.id]);
  }

  goCompetitions(): void {
    this.router.navigate(['/competitions']);
  }

  goNewCompetition(): void {
    this.router.navigate(['/competitions/new']);
  }

  logout(): void {
    this.auth.logout();
  }
}
