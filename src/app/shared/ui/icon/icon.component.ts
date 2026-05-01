import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgSwitch, NgSwitchCase } from '@angular/common';

export type IconName =
  | 'bell'
  | 'mail'
  | 'user'
  | 'calendar'
  | 'chat'
  | 'plus'
  | 'chev-r'
  | 'chev-l'
  | 'chev-d'
  | 'search'
  | 'filter'
  | 'trophy'
  | 'users'
  | 'shield'
  | 'whistle'
  | 'edit'
  | 'logout'
  | 'settings'
  | 'pin'
  | 'clock'
  | 'check'
  | 'x'
  | 'inbox'
  | 'trash'
  | 'dots'
  | 'upload'
  | 'stats'
  | 'flag'
  | 'menu'
  | 'copy'
  | 'refresh'
  | 'help';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [NgSwitch, NgSwitchCase],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<number>(18);
  readonly strokeWidth = input<number>(1.8);

  readonly sizePx = computed(() => `${this.size()}px`);
}
