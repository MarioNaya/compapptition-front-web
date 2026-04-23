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
const PX_PER_DAY = 66; // min-width del día (60) + gap aprox (6)

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
  readonly windowStart = signal<Date>(
    startOfDay(new Date(Date.now() - Math.floor(15 / 2) * DAY_MS)),
  );

  // Estado de drag: al arrastrar horizontalmente, la ventana de días se
  // desplaza (1 día por cada PX_PER_DAY px). No tocamos scrollLeft interno.
  private dragging = false;
  private dragStartX = 0;
  private lastAppliedShiftPx = 0;
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
    // Si el click viene justo tras un drag, ignora; el reset de `dragged`
    // ocurre en el siguiente pointerdown.
    if (this.dragged) return;
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
   * Drag horizontal para mover la ventana de días. Cada PX_PER_DAY px
   * arrastrados = 1 día de shift en la dirección contraria (drag derecha
   * muestra días anteriores, como en una línea temporal).
   *
   * Se resetea `dragged` en pointerdown (no en pointerup) para que el
   * click del día suprimido quede coherente con el flag.
   */
  onPointerDown(ev: PointerEvent): void {
    // Solo botón principal / touch / pen.
    if (ev.button !== undefined && ev.button !== 0) return;
    this.dragging = true;
    this.dragged = false;
    this.dragStartX = ev.clientX;
    this.lastAppliedShiftPx = 0;
  }

  onPointerMove(ev: PointerEvent): void {
    if (!this.dragging) return;
    const dx = ev.clientX - this.dragStartX;
    if (Math.abs(dx) > 5) this.dragged = true;

    // Aplica shift por pasos completos de PX_PER_DAY.
    const targetSteps = Math.trunc((dx - this.lastAppliedShiftPx) / PX_PER_DAY);
    if (targetSteps !== 0) {
      // drag a la derecha (dx positivo) → mostrar días anteriores → shift negativo.
      this.shiftWindow(-targetSteps);
      this.lastAppliedShiftPx += targetSteps * PX_PER_DAY;
    }
  }

  onPointerUp(_ev: PointerEvent): void {
    this.dragging = false;
    // No reseteamos `dragged` aquí: el click del día dispara inmediatamente
    // después y debe respetar el flag. El reset ocurre en el próximo pointerdown.
  }
}
