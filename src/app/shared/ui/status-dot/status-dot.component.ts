import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type DotColor = 'orange' | 'green' | 'gray' | 'red';

@Component({
  selector: 'app-status-dot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-dot.component.html',
  styleUrl: './status-dot.component.scss',
})
export class StatusDotComponent {
  readonly color = input<DotColor>('gray');
}
