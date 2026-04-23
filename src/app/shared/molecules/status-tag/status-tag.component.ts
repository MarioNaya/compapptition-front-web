import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EstadoCompeticion } from '@core/models/competicion/competicion.model';
import { EstadoEvento } from '@core/models/evento/evento.model';
import { StatusDotComponent, DotColor } from '@shared/ui/status-dot/status-dot.component';
import { TagComponent, TagVariant } from '@shared/ui/tag/tag.component';

type AnyState = EstadoCompeticion | EstadoEvento | string;

const LABELS: Record<string, string> = {
  [EstadoCompeticion.BORRADOR]: 'Borrador',
  [EstadoCompeticion.ACTIVA]: 'En curso',
  [EstadoCompeticion.FINALIZADA]: 'Finalizada',
  [EstadoCompeticion.CANCELADA]: 'Cancelada',
  [EstadoEvento.PROGRAMADO]: 'Programado',
  [EstadoEvento.EN_CURSO]: 'En juego',
  [EstadoEvento.FINALIZADO]: 'Finalizado',
  [EstadoEvento.SUSPENDIDO]: 'Suspendido',
  [EstadoEvento.APLAZADO]: 'Aplazado',
};

const COLOR_MAP: Record<string, { tag: TagVariant; dot: DotColor }> = {
  [EstadoCompeticion.BORRADOR]: { tag: 'gray', dot: 'gray' },
  [EstadoCompeticion.ACTIVA]: { tag: 'orange', dot: 'orange' },
  [EstadoCompeticion.FINALIZADA]: { tag: 'gray', dot: 'gray' },
  [EstadoCompeticion.CANCELADA]: { tag: 'red', dot: 'red' },
  [EstadoEvento.PROGRAMADO]: { tag: 'green', dot: 'green' },
  [EstadoEvento.EN_CURSO]: { tag: 'orange', dot: 'orange' },
  [EstadoEvento.FINALIZADO]: { tag: 'gray', dot: 'gray' },
  [EstadoEvento.SUSPENDIDO]: { tag: 'red', dot: 'red' },
  [EstadoEvento.APLAZADO]: { tag: 'gray', dot: 'gray' },
};

@Component({
  selector: 'app-status-tag',
  standalone: true,
  imports: [TagComponent, StatusDotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-tag.component.html',
  styleUrl: './status-tag.component.scss',
})
export class StatusTagComponent {
  readonly state = input.required<AnyState>();

  readonly label = computed(() => LABELS[this.state()] ?? String(this.state()));
  readonly palette = computed(() => COLOR_MAP[this.state()] ?? { tag: 'gray' as TagVariant, dot: 'gray' as DotColor });
}
