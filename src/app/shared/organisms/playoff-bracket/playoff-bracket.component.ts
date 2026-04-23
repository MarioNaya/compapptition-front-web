import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Evento, EstadoEvento } from '@core/models/evento/evento.model';

interface BracketNode {
  readonly evento: Evento;
  readonly x: number;
  readonly y: number;
  readonly round: number;
}

interface BracketEdge {
  readonly d: string; // SVG path
  readonly from: number;
  readonly to: number;
}

// Dimensiones del nodo y espaciado
const NODE_W = 200;
const NODE_H = 76;
const ROUND_GAP = 60; // horizontal entre columnas
const FIRST_ROUND_GAP = 14; // vertical entre matches en la primera ronda
const PAD_X = 32;
const PAD_Y = 40;

@Component({
  selector: 'app-playoff-bracket',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './playoff-bracket.component.html',
  styleUrl: './playoff-bracket.component.scss',
})
export class PlayoffBracketComponent {
  readonly eventos = input.required<readonly Evento[]>();
  readonly eventClick = output<Evento>();

  readonly rounds = computed<readonly (readonly Evento[])[]>(() => {
    const byJornada = new Map<number, Evento[]>();
    for (const e of this.eventos()) {
      const j = e.jornada ?? 0;
      if (!byJornada.has(j)) byJornada.set(j, []);
      byJornada.get(j)!.push(e);
    }
    const sortedJornadas = [...byJornada.keys()].sort((a, b) => a - b);
    return sortedJornadas.map((j) =>
      byJornada.get(j)!.sort((a, b) => (a.numeroPartido ?? 0) - (b.numeroPartido ?? 0)),
    );
  });

  readonly layout = computed<{
    nodes: readonly BracketNode[];
    edges: readonly BracketEdge[];
    width: number;
    height: number;
  }>(() => {
    const rounds = this.rounds();
    if (rounds.length === 0) {
      return { nodes: [], edges: [], width: 0, height: 0 };
    }

    // Altura total: primera ronda marca el espacio vertical.
    const firstRoundCount = rounds[0]!.length;
    const firstRoundPitch = NODE_H + FIRST_ROUND_GAP;
    const totalHeight = PAD_Y * 2 + firstRoundCount * firstRoundPitch - FIRST_ROUND_GAP;

    const nodeById = new Map<number, BracketNode>();
    const nodes: BracketNode[] = [];

    // Coloca cada ronda centrando los nodos según los padres (jornada anterior)
    rounds.forEach((round, rIdx) => {
      const x = PAD_X + rIdx * (NODE_W + ROUND_GAP);

      if (rIdx === 0) {
        round.forEach((ev, i) => {
          const y = PAD_Y + i * firstRoundPitch;
          const node = { evento: ev, x, y, round: rIdx };
          nodes.push(node);
          nodeById.set(ev.id, node);
        });
      } else {
        round.forEach((ev) => {
          const parentA = ev.partidoAnteriorLocalId != null ? nodeById.get(ev.partidoAnteriorLocalId) : null;
          const parentB = ev.partidoAnteriorVisitanteId != null ? nodeById.get(ev.partidoAnteriorVisitanteId) : null;
          let y: number;
          if (parentA && parentB) {
            y = (parentA.y + parentB.y) / 2;
          } else if (parentA) {
            y = parentA.y;
          } else if (parentB) {
            y = parentB.y;
          } else {
            // sin padres — coloca debajo del último nodo de esa ronda
            const last = nodes.filter((n) => n.round === rIdx).pop();
            y = last ? last.y + firstRoundPitch : PAD_Y;
          }
          const node = { evento: ev, x, y, round: rIdx };
          nodes.push(node);
          nodeById.set(ev.id, node);
        });
      }
    });

    // Conexiones
    const edges: BracketEdge[] = [];
    for (const node of nodes) {
      if (node.round === 0) continue;
      const parents = [
        node.evento.partidoAnteriorLocalId,
        node.evento.partidoAnteriorVisitanteId,
      ]
        .filter((id): id is number => id != null)
        .map((id) => nodeById.get(id))
        .filter((n): n is BracketNode => !!n);

      for (const p of parents) {
        const x1 = p.x + NODE_W;
        const y1 = p.y + NODE_H / 2;
        const x2 = node.x;
        const y2 = node.y + NODE_H / 2;
        const midX = (x1 + x2) / 2;
        const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
        edges.push({ d, from: p.evento.id, to: node.evento.id });
      }
    }

    const width = PAD_X * 2 + rounds.length * NODE_W + (rounds.length - 1) * ROUND_GAP;

    // Recalcular altura si alguna ronda posterior tiene nodo más bajo
    let maxY = 0;
    for (const n of nodes) {
      if (n.y + NODE_H > maxY) maxY = n.y + NODE_H;
    }
    const height = Math.max(totalHeight, maxY + PAD_Y);

    return { nodes, edges, width, height };
  });

  readonly nodeW = NODE_W;
  readonly nodeH = NODE_H;

  stateClass(ev: Evento): string {
    if (ev.estado === EstadoEvento.FINALIZADO) return 'finalized';
    if (ev.estado === EstadoEvento.EN_CURSO) return 'live';
    return 'pending';
  }

  winnerSide(ev: Evento): 'home' | 'away' | null {
    if (ev.estado !== EstadoEvento.FINALIZADO) return null;
    const rl = ev.resultadoLocal ?? 0;
    const rv = ev.resultadoVisitante ?? 0;
    if (rl > rv) return 'home';
    if (rv > rl) return 'away';
    return null;
  }

  onClick(ev: Evento): void {
    this.eventClick.emit(ev);
  }

  roundLabel(roundIndex: number, totalRounds: number): string {
    const remaining = totalRounds - roundIndex;
    if (remaining === 1) return 'Final';
    if (remaining === 2) return 'Semifinal';
    if (remaining === 3) return 'Cuartos';
    if (remaining === 4) return 'Octavos';
    return `Ronda ${roundIndex + 1}`;
  }
}
