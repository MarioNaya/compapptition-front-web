import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CompeticionSimple } from '@core/models/competicion/competicion.model';
import { StatusTagComponent } from '@shared/molecules/status-tag/status-tag.component';

@Component({
  selector: 'app-competition-card',
  standalone: true,
  imports: [StatusTagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './competition-card.component.html',
  styleUrl: './competition-card.component.scss',
})
export class CompetitionCardComponent {
  readonly competicion = input.required<CompeticionSimple>();

  readonly opened = output<CompeticionSimple>();

  open(): void {
    this.opened.emit(this.competicion());
  }
}
