import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Evento } from '@core/models/evento/evento.model';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { MatchRowComponent } from '@shared/molecules/match-row/match-row.component';
import { ApiError } from '@core/http/api-error.model';
import { EventoService } from '@features/events/services/evento.service';

@Component({
  selector: 'app-matches-tab',
  standalone: true,
  imports: [SpinnerComponent, EmptyStateComponent, MatchRowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './matches-tab.component.html',
  styleUrl: './matches-tab.component.scss',
})
export class MatchesTabComponent implements OnInit {
  private readonly service = inject(EventoService);
  private readonly router = inject(Router);

  readonly competicionId = input.required<number>();

  readonly loading = signal(true);
  readonly eventos = signal<readonly Evento[]>([]);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.service.findByCompeticion$(this.competicionId()).subscribe({
      next: (list) => {
        this.eventos.set(list);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message ?? 'Error al cargar partidos');
        this.loading.set(false);
      },
    });
  }

  openEvent(evento: Evento): void {
    this.router.navigate(['/competitions', this.competicionId(), 'events', evento.id]);
  }
}
