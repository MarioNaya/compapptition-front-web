import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-position-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './position-pill.component.html',
  styleUrl: './position-pill.component.scss',
})
export class PositionPillComponent {
  readonly position = input.required<number>();

  readonly tier = computed(() => {
    const p = this.position();
    if (p === 1) return 'p1';
    if (p <= 3) return 'p2-3';
    return 'pn';
  });
}
