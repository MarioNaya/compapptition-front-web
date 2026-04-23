import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Evento } from '@core/models/evento/evento.model';
import { ApiError } from '@core/http/api-error.model';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { ToastService } from '@shared/services/toast.service';
import { EventoService } from '@features/events/services/evento.service';

interface DayCell {
  readonly iso: string;
  readonly day: number;
  readonly inMonth: boolean;
  readonly isToday: boolean;
  readonly eventos: readonly Evento[];
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfMonth(y: number, m: number): Date {
  return new Date(y, m, 1);
}

@Component({
  selector: 'app-calendar-tab',
  standalone: true,
  imports: [DatePipe, IconComponent, SpinnerComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-tab.component.html',
  styleUrl: './calendar-tab.component.scss',
})
export class CalendarTabComponent implements OnChanges {
  private readonly eventoService = inject(EventoService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly competicionId = input.required<number>();
  readonly canEdit = input<boolean>(false);

  readonly loading = signal(true);
  readonly eventos = signal<readonly Evento[]>([]);

  // Mes visible: 1er día del mes
  readonly year = signal<number>(new Date().getFullYear());
  readonly month = signal<number>(new Date().getMonth());

  readonly monthLabel = computed(() => `${MONTH_NAMES[this.month()]} ${this.year()}`);
  readonly weekdays = WEEKDAYS;

  readonly grid = computed<readonly DayCell[]>(() => {
    const y = this.year();
    const m = this.month();
    const first = startOfMonth(y, m);
    // Offset para que el lunes sea el primer día (dayOfWeek 0=dom, 1=lun...)
    const dayOfWeek = first.getDay();
    const leading = (dayOfWeek + 6) % 7; // días previos a mostrar del mes anterior
    const cells: DayCell[] = [];
    const todayIso = toIso(new Date());

    const byIso = new Map<string, Evento[]>();
    for (const e of this.eventos()) {
      const iso = toIso(new Date(e.fechaHora));
      if (!byIso.has(iso)) byIso.set(iso, []);
      byIso.get(iso)!.push(e);
    }

    // 6 filas × 7 cols = 42 celdas
    for (let i = 0; i < 42; i++) {
      const date = new Date(y, m, i - leading + 1);
      const iso = toIso(date);
      cells.push({
        iso,
        day: date.getDate(),
        inMonth: date.getMonth() === m,
        isToday: iso === todayIso,
        eventos: (byIso.get(iso) ?? []).sort(
          (a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime(),
        ),
      });
    }
    return cells;
  });

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
          this.toast.error(err.message ?? 'Error al cargar el calendario');
        }
      },
    });
  }

  prevMonth(): void {
    const m = this.month();
    if (m === 0) {
      this.month.set(11);
      this.year.update((y) => y - 1);
    } else {
      this.month.set(m - 1);
    }
  }

  nextMonth(): void {
    const m = this.month();
    if (m === 11) {
      this.month.set(0);
      this.year.update((y) => y + 1);
    } else {
      this.month.set(m + 1);
    }
  }

  today(): void {
    const t = new Date();
    this.year.set(t.getFullYear());
    this.month.set(t.getMonth());
  }

  openEvent(ev: Evento, e: MouseEvent): void {
    e.stopPropagation();
    this.router.navigate(['/app/competitions', this.competicionId(), 'events', ev.id]);
  }

  clickDay(cell: DayCell): void {
    if (!this.canEdit()) return;
    if (!cell.inMonth) return;
    // Redirige a crear evento con la fecha precargada por queryParam.
    this.router.navigate(
      ['/app/competitions', this.competicionId(), 'events', 'new'],
      { queryParams: { date: cell.iso } },
    );
  }
}
