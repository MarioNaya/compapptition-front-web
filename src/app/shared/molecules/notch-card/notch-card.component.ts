import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-notch-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notch-card.component.html',
  styleUrl: './notch-card.component.scss',
})
export class NotchCardComponent {
  readonly tag = input.required<string>();
  readonly pulse = input<boolean>(true);
}
