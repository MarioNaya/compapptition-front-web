import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { Evento } from '@core/models/evento/evento.model';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { TeamCrestComponent } from '@shared/ui/team-crest/team-crest.component';
import { StatusTagComponent } from '@shared/molecules/status-tag/status-tag.component';

@Component({
  selector: 'app-match-row',
  standalone: true,
  imports: [DatePipe, UpperCasePipe, IconComponent, TeamCrestComponent, StatusTagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './match-row.component.html',
  styleUrl: './match-row.component.scss',
})
export class MatchRowComponent {
  readonly evento = input.required<Evento>();

  readonly opened = output<Evento>();

  open(): void {
    this.opened.emit(this.evento());
  }
}
