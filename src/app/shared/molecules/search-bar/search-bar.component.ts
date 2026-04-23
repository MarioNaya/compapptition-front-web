import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@shared/ui/icon/icon.component';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent {
  readonly value = input<string>('');
  readonly placeholder = input<string>('Buscar…');
  readonly showFilter = input<boolean>(false);

  readonly valueChange = output<string>();
  readonly filterClicked = output<void>();

  onInput(next: string): void {
    this.valueChange.emit(next);
  }

  clickFilter(): void {
    this.filterClicked.emit();
  }
}
