import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Equipo } from '@core/models/equipo/equipo.model';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { TeamCrestComponent } from '@shared/ui/team-crest/team-crest.component';

@Component({
  selector: 'app-team-card',
  standalone: true,
  imports: [IconComponent, TeamCrestComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-card.component.html',
  styleUrl: './team-card.component.scss',
})
export class TeamCardComponent {
  readonly equipo = input.required<Equipo>();

  readonly opened = output<Equipo>();

  open(): void {
    this.opened.emit(this.equipo());
  }
}
