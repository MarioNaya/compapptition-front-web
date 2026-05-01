import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { TourService } from '@core/services/tour.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';

interface Rect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

const PADDING = 8;
const TOOLTIP_W = 320;
const TOOLTIP_GAP = 12;

/**
 * Overlay del tour guiado. Resuelve el target de cada paso, dibuja el
 * spotlight (un agujero virtual mediante {@code box-shadow} gigantesco) y
 * coloca el tooltip junto al elemento. Reacciona al cambio de paso para
 * recalcular posiciones; también reposiciona en resize/scroll.
 */
@Component({
  selector: 'app-tour-overlay',
  standalone: true,
  imports: [ButtonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tour-overlay.component.html',
  styleUrl: './tour-overlay.component.scss',
})
export class TourOverlayComponent {
  private readonly tour = inject(TourService);
  private readonly destroyRef = inject(DestroyRef);

  readonly running = this.tour.running;
  readonly step = this.tour.currentStep;
  readonly index = this.tour.index;
  readonly total = this.tour.total;
  readonly isLast = this.tour.isLast;
  readonly isFirst = this.tour.isFirst;

  /** Bounding rect del target en coordenadas viewport. Null si no se encuentra. */
  readonly targetRect = signal<Rect | null>(null);

  readonly spotlightStyle = computed(() => {
    const r = this.targetRect();
    if (!r) return 'display:none;';
    return `top:${r.top - PADDING}px; left:${r.left - PADDING}px; width:${r.width + PADDING * 2}px; height:${r.height + PADDING * 2}px;`;
  });

  /**
   * Coloca el tooltip respecto al spotlight. Calcula la posición preferente
   * (placement del paso, default 'bottom') y cae a la opuesta si no cabe.
   * Si tampoco cabe ahí, lo centramos en pantalla.
   */
  readonly tooltipStyle = computed(() => {
    const r = this.targetRect();
    if (!r) return 'top:50%; left:50%; transform:translate(-50%, -50%);';
    const placement = this.step()?.placement ?? 'auto';
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Usamos altura aproximada para decidir placement (se ajusta por CSS).
    const tooltipH = 200;

    const fitsBelow = r.top + r.height + TOOLTIP_GAP + tooltipH < vh;
    const fitsAbove = r.top - TOOLTIP_GAP - tooltipH > 0;
    const fitsRight = r.left + r.width + TOOLTIP_GAP + TOOLTIP_W < vw;
    const fitsLeft = r.left - TOOLTIP_GAP - TOOLTIP_W > 0;

    let chosen: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
    if (placement === 'auto') {
      if (fitsBelow) chosen = 'bottom';
      else if (fitsAbove) chosen = 'top';
      else if (fitsRight) chosen = 'right';
      else if (fitsLeft) chosen = 'left';
    } else if (placement === 'bottom') chosen = fitsBelow ? 'bottom' : fitsAbove ? 'top' : 'bottom';
    else if (placement === 'top') chosen = fitsAbove ? 'top' : fitsBelow ? 'bottom' : 'top';
    else if (placement === 'right') chosen = fitsRight ? 'right' : fitsLeft ? 'left' : 'bottom';
    else if (placement === 'left') chosen = fitsLeft ? 'left' : fitsRight ? 'right' : 'bottom';

    let top = 0;
    let left = 0;
    switch (chosen) {
      case 'bottom':
        top = r.top + r.height + TOOLTIP_GAP;
        left = Math.max(12, Math.min(vw - TOOLTIP_W - 12, r.left + r.width / 2 - TOOLTIP_W / 2));
        break;
      case 'top':
        top = Math.max(12, r.top - TOOLTIP_GAP - tooltipH);
        left = Math.max(12, Math.min(vw - TOOLTIP_W - 12, r.left + r.width / 2 - TOOLTIP_W / 2));
        break;
      case 'right':
        top = Math.max(12, r.top + r.height / 2 - tooltipH / 2);
        left = r.left + r.width + TOOLTIP_GAP;
        break;
      case 'left':
        top = Math.max(12, r.top + r.height / 2 - tooltipH / 2);
        left = Math.max(12, r.left - TOOLTIP_GAP - TOOLTIP_W);
        break;
    }

    return `top:${top}px; left:${left}px; width:${TOOLTIP_W}px;`;
  });

  constructor() {
    // Al cambiar de paso o arrancar, calcula el rect y hace scroll al elemento.
    effect(() => {
      const s = this.step();
      if (!s || !this.running()) {
        this.targetRect.set(null);
        return;
      }
      this.recalcOnNextFrame(s.selector);
    });

    // Reposiciona en resize/scroll mientras el tour corre.
    const onResize = () => this.recalcCurrent();
    const onScroll = () => this.recalcCurrent();
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    });
  }

  next(): void {
    this.tour.next();
  }

  prev(): void {
    this.tour.prev();
  }

  cancel(): void {
    this.tour.cancel();
  }

  private recalcCurrent(): void {
    const s = this.step();
    if (s) this.recalcOnNextFrame(s.selector);
  }

  private recalcOnNextFrame(selector: string): void {
    // Espera al siguiente frame para que la vista esté pintada antes de medir.
    requestAnimationFrame(() => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) {
        this.targetRect.set(null);
        return;
      }
      // Trae el target a viewport si está fuera.
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      // Reintenta tras un pequeño delay para coger la posición tras el scroll.
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        this.targetRect.set({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }, 250);
    });
  }
}
