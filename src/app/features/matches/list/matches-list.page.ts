import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { forkJoin, of, switchMap } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { Evento, EstadoEvento } from '@core/models/evento/evento.model';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { TeamPairComponent } from '@shared/molecules/team-pair/team-pair.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { ToastService } from '@shared/services/toast.service';
import { CompeticionService } from '@features/competitions/services/competicion.service';
import { EventoService } from '@features/events/services/evento.service';

type Filter = 'PROXIMOS' | 'PASADOS' | 'TODOS';

@Component({
  selector: 'app-matches-list-page',
  standalone: true,
  imports: [
    DatePipe,
    UpperCasePipe,
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    PageHeaderComponent,
    TeamPairComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './matches-list.page.html',
  styleUrl: './matches-list.page.scss',
})
export class MatchesListPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly compService = inject(CompeticionService);
  private readonly eventoService = inject(EventoService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  private readonly _events = signal<readonly Evento[]>([]);
  readonly filter = signal<Filter>('PROXIMOS');

  readonly events = computed<readonly Evento[]>(() => {
    const now = Date.now();
    const filter = this.filter();
    return [...this._events()]
      .filter((e) => {
        if (filter === 'TODOS') return true;
        const ts = new Date(e.fechaHora).getTime();
        return filter === 'PROXIMOS' ? ts >= now : ts < now;
      })
      .sort((a, b) =>
        filter === 'PASADOS'
          ? new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
          : new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime(),
      );
  });

  readonly proximos = computed<number>(() => {
    const now = Date.now();
    return this._events().filter(
      (e) => e.estado === EstadoEvento.PROGRAMADO && new Date(e.fechaHora).getTime() >= now,
    ).length;
  });

  ngOnInit(): void {
    const userId = this.auth.currentUser()?.id;
    if (userId == null) return;
    this.loading.set(true);
    this.compService
      .misCompeticionesPorRol$(userId)
      .pipe(
        switchMap((porRol) => {
          const ids = new Set<number>();
          for (const c of [...porRol.admin, ...porRol.manager, ...porRol.arbitro, ...porRol.jugador]) {
            ids.add(c.id);
          }
          if (ids.size === 0) return of([] as Evento[][]);
          return forkJoin([...ids].map((id) => this.eventoService.findByCompeticion$(id)));
        }),
      )
      .subscribe({
        next: (eventsByComp) => {
          this._events.set(eventsByComp.flat());
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.loading.set(false);
          this.toast.error(err.message ?? 'Error al cargar partidos');
        },
      });
  }

  setFilter(f: Filter): void {
    this.filter.set(f);
  }

  open(e: Evento): void {
    this.router.navigate(['/app/competitions', e.competicionId, 'events', e.id]);
  }

  goBack(): void {
    this.router.navigate(['/app/dashboard']);
  }
}
