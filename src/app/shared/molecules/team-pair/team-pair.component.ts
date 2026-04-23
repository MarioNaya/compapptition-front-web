import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CrestSize, TeamCrestComponent } from '@shared/ui/team-crest/team-crest.component';

@Component({
  selector: 'app-team-pair',
  standalone: true,
  imports: [TeamCrestComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-pair.component.html',
  styleUrl: './team-pair.component.scss',
})
export class TeamPairComponent {
  readonly home = input.required<string>();
  readonly away = input.required<string>();
  readonly homeCrest = input<string | null>(null);
  readonly awayCrest = input<string | null>(null);
  readonly size = input<CrestSize>('sm');
}
