import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Banner informativo de cookies y almacenamiento local.
 *
 * No es un consent layer (no hay tracking ni analytics de terceros). Sólo
 * informa al usuario de las cookies estrictamente necesarias y del uso de
 * localStorage para el access token. Se cierra con un único botón "Entendido"
 * que persiste un flag en localStorage para no volver a mostrarlo.
 *
 * Cierra el ítem #6 del plan pre-deploy (B4).
 */
@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cookie-banner.component.html',
  styleUrl: './cookie-banner.component.scss',
})
export class CookieBannerComponent {
  private static readonly STORAGE_KEY = 'compapption.cookie-notice-ack';
  private static readonly STORAGE_VALUE = '1';

  /** True mientras el banner debe mostrarse. */
  protected readonly visible = signal(this.shouldShow());

  acknowledge(): void {
    try {
      localStorage.setItem(
        CookieBannerComponent.STORAGE_KEY,
        CookieBannerComponent.STORAGE_VALUE,
      );
    } catch {
      // Modo privado o sin acceso a localStorage: no persistimos pero igual
      // ocultamos para esta sesión. Volverá a aparecer al próximo arranque.
    }
    this.visible.set(false);
  }

  private shouldShow(): boolean {
    try {
      return (
        localStorage.getItem(CookieBannerComponent.STORAGE_KEY) !==
        CookieBannerComponent.STORAGE_VALUE
      );
    } catch {
      // SSR o storage bloqueado → no bloqueamos la UI mostrando un banner
      // que no se va a poder dismiss.
      return false;
    }
  }
}
