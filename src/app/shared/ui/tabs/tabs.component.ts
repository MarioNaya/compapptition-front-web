import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface TabOption {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
})
export class TabsComponent {
  readonly options = input.required<readonly TabOption[]>();
  readonly value = input.required<string>();

  readonly valueChange = output<string>();

  select(option: TabOption): void {
    if (option.value === this.value()) return;
    this.valueChange.emit(option.value);
  }
}
