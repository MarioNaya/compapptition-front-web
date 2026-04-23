import { ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild, computed, input, output, signal } from '@angular/core';
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
  // Impar: el día del medio queda en el centro geométrico perfecto.
  readonly windowDays = input<number>(15);

  readonly selectedDate = signal<string>(toIso(new Date()));
  // Centra el día actual: mitad hacia atrás (floor(windowDays/2)).
  readonly windowStart = signal<Date>(
    startOfDay(new Date(Date.now() - Math.floor(15 / 2) * DAY_MS)),
  );

  @ViewChild('daysRow') daysRow?: ElementRef<HTMLDivElement>;
  private dragging = false;
  private dragStartX = 0;
  private dragStartScroll = 0;
  private dragged = false;

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
    const half = Math.floor(this.windowDays() / 2);
    this.windowStart.set(startOfDay(new Date(today.getTime() - half * DAY_MS)));
    this.selectDay(toIso(today));
  }

  /**
   * Drag horizontal con mouse/touch. Si el usuario arrastra más de 5px, se
   * considera drag y el click final sobre un día se suprime. Si es un click
   * puro (sin mover), selectDay se dispara normalmente.
   */
  onPointerDown(ev: PointerEvent): void {
    const row = this.daysRow?.nativeElement;
    if (!row) return;
    this.dragging = true;
    this.dragged = false;
    this.dragStartX = ev.clientX;
    this.dragStartScroll = row.scrollLeft;
    row.setPointerCapture(ev.pointerId);
  }

  onPointerMove(ev: PointerEvent): void {
    if (!this.dragging) return;
    const row = this.daysRow?.nativeElement;
    if (!row) return;
    const dx = ev.clientX - this.dragStartX;
    if (Math.abs(dx) > 5) this.dragged = true;
    row.scrollLeft = this.dragStartScroll - dx;
  }

  onPointerUp(ev: PointerEvent): void {
    const row = this.daysRow?.nativeElement;
    if (row && row.hasPointerCapture(ev.pointerId)) {
      row.releasePointerCapture(ev.pointerId);
    }
    this.dragging = false;
    // Reset en el próximo tick — el click sobre el día se dispara después.
    setTimeout(() => (this.dragged = false), 0);
  }

  /** Devuelve true si se suprime el click (porque fue un drag). */
  shouldSuppressClick(): boolean {
    return this.dragged;
  }
}
