import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type CrestSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-team-crest',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-crest.component.html',
  styleUrl: './team-crest.component.scss',
})
export class TeamCrestComponent {
  readonly name = input.required<string>();
  readonly imageUrl = input<string | null>(null);
  readonly size = input<CrestSize>('md');

  readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? parts[0]?.[1] ?? '';
    return (first + second).toUpperCase();
  });

  readonly hasImage = computed(() => {
    const u = this.imageUrl();
    return typeof u === 'string' && u.trim().length > 0;
  });
}
