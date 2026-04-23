import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Evento } from '@core/models/evento/evento.model';
import { ApiError } from '@core/http/api-error.model';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { PlayoffBracketComponent } from '@shared/organisms/playoff-bracket/playoff-bracket.component';
import { ToastService } from '@shared/services/toast.service';
import { EventoService } from '@features/events/services/evento.service';

type ViewMode = 'regular' | 'playoff';

@Component({
  selector: 'app-bracket-tab',
  standalone: true,
  imports: [DatePipe, SpinnerComponent, EmptyStateComponent, PlayoffBracketComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bracket-tab.component.html',
  styleUrl: './bracket-tab.component.scss',
})
export class BracketTabComponent implements OnChanges {
  private readonly eventoService = inject(EventoService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly competicionId = input.required<number>();
  readonly placeholderSize = input<number | null>(null);

  readonly loading = signal(true);
  readonly eventos = signal<readonly Evento[]>([]);
  readonly view = signal<ViewMode>('playoff');

  // Eventos playoff: los que tienen parents o son parents.
  readonly playoffEvents = computed<readonly Evento[]>(() => {
    const all = this.eventos();
    if (all.length === 0) return [];
    const parentIds = new Set<number>();
    for (const e of all) {
      if (e.partidoAnteriorLocalId != null) parentIds.add(e.partidoAnteriorLocalId);
      if (e.partidoAnteriorVisitanteId != null) parentIds.add(e.partidoAnteriorVisitanteId);
    }
    return all.filter(
      (e) =>
        e.partidoAnteriorLocalId != null ||
        e.partidoAnteriorVisitanteId != null ||
        parentIds.has(e.id),
    );
  });

  // Eventos temporada regular: todos los que NO son playoff.
  readonly regularEvents = computed<readonly Evento[]>(() => {
    const playoffIds = new Set(this.playoffEvents().map((e) => e.id));
    return this.eventos()
      .filter((e) => !playoffIds.has(e.id))
      .sort((a, b) => {
        const ja = a.jornada ?? 0;
        const jb = b.jornada ?? 0;
        if (ja !== jb) return ja - jb;
        return new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime();
      });
  });

  readonly hasRegular = computed(() => this.regularEvents().length > 0);
  readonly hasPlayoff = computed(
    () => this.playoffEvents().length > 0 || this.placeholderSize() != null,
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['competicionId']) this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.eventoService.findByCompeticion$(this.competicionId()).subscribe({
      next: (list) => {
        this.eventos.set(list);
        this.loading.set(false);
        // Selecciona la vista inicial: si solo hay regular, mostrarlo; si hay
        // playoff (o placeholder), empezar por playoff.
        if (this.regularEvents().length > 0 && this.playoffEvents().length === 0) {
          this.view.set('regular');
        } else {
          this.view.set('playoff');
        }
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        if (err.status !== 404) {
          this.toast.error(err.message ?? 'Error al cargar el cuadro');
        }
      },
    });
  }

  setView(v: ViewMode): void {
    this.view.set(v);
  }

  openEvent(ev: Evento): void {
    this.router.navigate(['/app/competitions', this.competicionId(), 'events', ev.id]);
  }
}
