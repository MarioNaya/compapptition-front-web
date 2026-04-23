import { DestroyRef, Directive, ElementRef, OnInit, inject, input, output } from '@angular/core';

/**
 * Emite cuando el usuario hace click (o touch) fuera del host.
 * Aplicar al panel/dropdown que quieres cerrar:
 *   <div appClickOutside [enabled]="open()" (clickOutside)="close()">...</div>
 *
 * El listener vive en `document` y respeta captura para evitar que el click
 * sobre el trigger (que abre el panel) lo cierre inmediatamente: el trigger
 * debe estar DENTRO del host o el host debe ignorar el primer tick.
 */
@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective implements OnInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly enabled = input<boolean>(true);
  readonly clickOutside = output<PointerEvent | MouseEvent | TouchEvent>();

  ngOnInit(): void {
    const handler = (ev: MouseEvent | TouchEvent) => {
      if (!this.enabled()) return;
      const target = ev.target as Node | null;
      if (!target) return;
      if (this.elementRef.nativeElement.contains(target)) return;
      this.clickOutside.emit(ev as PointerEvent);
    };

    // `capture: true` para que llegue antes de que Angular gestione el click en
    // otros handlers, pero tras un microtask para no capturar el mismo click
    // que abre el panel.
    const attach = () =>
      document.addEventListener('mousedown', handler, true);
    const detach = () =>
      document.removeEventListener('mousedown', handler, true);

    // Retraso en el mismo tick para que el click que abre el panel no lo cierre.
    setTimeout(attach, 0);
    this.destroyRef.onDestroy(detach);
  }
}
