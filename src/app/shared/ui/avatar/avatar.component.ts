import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly imageUrl = input<string | null>(null);
  readonly size = input<AvatarSize>('md');
  /**
   * Cuando el avatar va junto al nombre del usuario en el mismo bloque, el
   * lector de pantalla repite el nombre. Pasar {@code [decorative]="true"}
   * pone {@code alt=""} para evitar el doble anuncio (cierra AF-21).
   */
  readonly decorative = input<boolean>(false);

  readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return (first + second).toUpperCase();
  });

  readonly hasImage = computed(() => {
    const u = this.imageUrl();
    return typeof u === 'string' && u.trim().length > 0;
  });
}
