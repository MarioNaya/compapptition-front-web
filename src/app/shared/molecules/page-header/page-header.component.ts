import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '@shared/ui/icon/icon.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  private readonly location = inject(Location);

  readonly eyebrow = input<string | null>(null);
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);

  /**
   * Destino de la navegación "volver". Acepta:
   * - Array de path commands: `['/app/competitions', id]` → routerLink.
   * - String de path completo: `'/app/dashboard'` → routerLink.
   * - `true` → usa `Location.back()` del historial (SPA).
   * - `null/undefined` → no muestra el botón.
   */
  readonly back = input<readonly unknown[] | string | true | null>(null);

  readonly showBack = () => this.back() !== null && this.back() !== undefined;
  readonly backAsLink = () => {
    const b = this.back();
    return b === true || b === null ? null : b;
  };

  onBackClick(ev: MouseEvent): void {
    if (this.back() === true) {
      ev.preventDefault();
      this.location.back();
    }
  }
}
