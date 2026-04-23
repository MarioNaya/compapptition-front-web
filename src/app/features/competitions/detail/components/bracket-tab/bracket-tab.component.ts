import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Evento } from '@core/models/evento/evento.model';
import { ApiError } from '@core/http/api-error.model';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { PlayoffBracketComponent } from '@shared/organisms/playoff-bracket/playoff-bracket.component';
import { ToastService } from '@shared/services/toast.service';
import { EventoService } from '@features/events/services/evento.service';

@Component({
  selector: 'app-bracket-tab',
  standalone: true,
  imports: [SpinnerComponent, EmptyStateComponent, PlayoffBracketComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="loading"><app-spinner size="md" label="Cargando cuadro" /></div>
    } @else if (eventos().length === 0 && !placeholderSize()) {
      <app-empty-state
        icon="trophy"
        title="Aún no hay cuadro de playoff"
        subtitle="Configura el número de equipos en playoff y genera el calendario desde la sección de calendario."
      />
    } @else {
      <app-playoff-bracket
        [eventos]="eventos()"
        [placeholderSize]="placeholderSize()"
        (eventClick)="openEvent($event)"
      />
    }
  `,
  styles: [
    `
      :host { display: block; padding-top: 12px; }
      .loading { padding: 60px 20px; display: flex; justify-content: center; }
    `,
  ],
})
export class BracketTabComponent implements OnChanges {
  private readonly eventoService = inject(EventoService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly competicionId = input.required<number>();
  readonly placeholderSize = input<number | null>(null);

  readonly loading = signal(true);
  readonly eventos = signal<readonly Evento[]>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['competicionId']) this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.eventoService.findByCompeticion$(this.competicionId()).subscribe({
      next: (list) => {
        this.eventos.set(list);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        if (err.status !== 404) {
          this.toast.error(err.message ?? 'Error al cargar el cuadro');
        }
      },
    });
  }

  openEvent(ev: Evento): void {
    this.router.navigate(['/app/competitions', this.competicionId(), 'events', ev.id]);
  }
}
