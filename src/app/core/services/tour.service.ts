import { Injectable, computed, signal } from '@angular/core';

/**
 * Un paso del tour. {@code selector} es un selector CSS que se resuelve al
 * elemento a resaltar. {@code placement} indica dónde colocar el tooltip;
 * 'auto' (default) lo decide el componente según el espacio disponible.
 */
export interface TourStep {
  readonly selector: string;
  readonly title: string;
  readonly description: string;
  readonly placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

/**
 * Servicio que orquesta el tour guiado. Mantiene la lista de pasos activa,
 * el índice actual y las acciones siguiente/cancelar. El componente overlay
 * (montado en main-layout) escucha estos signals y pinta el spotlight + tooltip.
 */
@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly _running = signal(false);
  private readonly _index = signal(0);
  private readonly _steps = signal<readonly TourStep[]>([]);

  readonly running = this._running.asReadonly();
  readonly index = this._index.asReadonly();
  readonly steps = this._steps.asReadonly();

  readonly currentStep = computed<TourStep | null>(
    () => this._steps()[this._index()] ?? null,
  );

  readonly isLast = computed(() => this._index() === this._steps().length - 1);
  readonly isFirst = computed(() => this._index() === 0);
  readonly total = computed(() => this._steps().length);

  /** Arranca el tour con los pasos indicados; ignora si la lista está vacía. */
  start(steps: readonly TourStep[]): void {
    if (steps.length === 0) return;
    this._steps.set(steps);
    this._index.set(0);
    this._running.set(true);
  }

  /** Avanza al siguiente paso o cierra el tour si era el último. */
  next(): void {
    if (!this._running()) return;
    const next = this._index() + 1;
    if (next >= this._steps().length) {
      this.cancel();
    } else {
      this._index.set(next);
    }
  }

  /** Retrocede al paso anterior si lo hay. */
  prev(): void {
    if (!this._running()) return;
    if (this._index() > 0) this._index.update((i) => i - 1);
  }

  /** Cierra el tour sin avisar. */
  cancel(): void {
    this._running.set(false);
    this._index.set(0);
    this._steps.set([]);
  }
}
