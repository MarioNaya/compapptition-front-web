import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Evento } from '@core/models/evento/evento.model';
import { IconComponent } from '@shared/ui/icon/icon.component';

interface DayCell {
  readonly date: Date;
  readonly iso: string; // YYYY-MM-DD
  readonly dayNum: number;
  readonly weekday: string;
  readonly count: number;
  readonly isToday: boolean;
  readonly isPast: boolean;
}

const DAY_MS = 86_400_000;

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

@Component({
  selector: 'app-calendar-strip',
  standalone: true,
  imports: [DatePipe, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-strip.component.html',
  styleUrl: './calendar-strip.component.scss',
})
export class CalendarStripComponent {
  readonly events = input<readonly Evento[]>([]);
  readonly windowDays = input<number>(14);

  readonly selectedDate = signal<string>(toIso(new Date()));
  readonly windowStart = signal<Date>(startOfDay(new Date(Date.now() - 2 * DAY_MS)));

  readonly selected = output<string>();

  readonly days = computed<readonly DayCell[]>(() => {
    const start = this.windowStart();
    const n = this.windowDays();
    const countByIso = new Map<string, number>();
    for (const e of this.events()) {
      const iso = toIso(new Date(e.fechaHora));
      countByIso.set(iso, (countByIso.get(iso) ?? 0) + 1);
    }
    const todayIso = toIso(new Date());
    const todayMs = startOfDay(new Date()).getTime();
    const cells: DayCell[] = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(start.getTime() + i * DAY_MS);
      const iso = toIso(d);
      cells.push({
        date: d,
        iso,
        dayNum: d.getDate(),
        weekday: d.toLocaleDateString('es', { weekday: 'short' }),
        count: countByIso.get(iso) ?? 0,
        isToday: iso === todayIso,
        isPast: d.getTime() < todayMs,
      });
    }
    return cells;
  });

  readonly selectedLabel = computed(() => {
    const iso = this.selectedDate();
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  });

  readonly eventsOfSelected = computed<readonly Evento[]>(() => {
    const iso = this.selectedDate();
    return this.events()
      .filter((e) => toIso(new Date(e.fechaHora)) === iso)
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  });

  selectDay(iso: string): void {
    this.selectedDate.set(iso);
    this.selected.emit(iso);
  }

  shiftWindow(delta: number): void {
    const current = this.windowStart();
    this.windowStart.set(new Date(current.getTime() + delta * DAY_MS));
  }

  goToday(): void {
    const today = new Date();
    this.windowStart.set(startOfDay(new Date(today.getTime() - 2 * DAY_MS)));
    this.selectDay(toIso(today));
  }
}
