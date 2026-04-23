import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TagVariant = 'orange' | 'green' | 'gray' | 'red';

@Component({
  selector: 'app-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.scss',
})
export class TagComponent {
  readonly variant = input<TagVariant>('gray');
}
