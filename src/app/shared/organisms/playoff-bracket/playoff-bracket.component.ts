import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Evento, EstadoEvento } from '@core/models/evento/evento.model';

interface BracketNodeData {
  readonly id: number;
  readonly round: number;
  readonly numeroPartido?: number;
  readonly parentLocalId?: number;
  readonly parentVisitanteId?: number;
  readonly homeLabel: string;
  readonly awayLabel: string;
  readonly homeScore?: number;
  readonly awayScore?: number;
  readonly state: 'placeholder' | 'pending' | 'live' | 'finalized';
  readonly realEvento?: Evento;
}

interface BracketNode {
  readonly data: BracketNodeData;
  readonly x: number;
  readonly y: number;
  readonly round: number;
}

interface BracketEdge {
  readonly d: string;
  readonly from: number;
  readonly to: number;
}

const NODE_W = 200;
const NODE_H = 76;
const ROUND_GAP = 60;
const FIRST_ROUND_GAP = 14;
const PAD_X = 32;
const PAD_Y = 40;

/**
 * Devuelve las parejas de la primera ronda según seeding estándar.
 * Para N=8: [[1,8],[4,5],[2,7],[3,6]] (los seeds 1 y 2 no se cruzan hasta la final).
 */
function buildPairings(n: number): ReadonlyArray<readonly [number, number]> {
  if (n < 2 || (n & (n - 1)) !== 0) return []; // requiere potencia de 2
  if (n === 2) return [[1, 2]];
  const prev = buildPairings(n / 2);
  const result: Array<readonly [number, number]> = [];
  for (const [s1, s2] of prev) {
    result.push([s1, n + 1 - s1]);
    result.push([s2, n + 1 - s2]);
  }
  return result;
}

function ordinal(n: number): string {
  return `${n}º`;
}

@Component({
  selector: 'app-playoff-bracket',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './playoff-bracket.component.html',
  styleUrl: './playoff-bracket.component.scss',
})
export class PlayoffBracketComponent {
  readonly eventos = input.required<readonly Evento[]>();
  /**
   * Si se pasa y no hay eventos reales, renderiza un cuadro placeholder con
   * los seeds (1º vs N, 2º vs N-1...) y rondas posteriores como "TBD".
   * Debe ser potencia de 2.
   */
  readonly placeholderSize = input<number | null>(null);

  readonly eventClick = output<Evento>();

  readonly nodeW = NODE_W;
  readonly nodeH = NODE_H;

  /**
   * Agrupa los BracketNodeData por ronda.
   * - Si hay eventos reales, los convierte a BracketNodeData.
   * - Si no y `placeholderSize` es válido, genera un árbol completo con seeds.
   */
  readonly rounds = computed<readonly (readonly BracketNodeData[])[]>(() => {
    const ev = this.eventos();
    if (ev.length > 0) {
      return this.buildFromEventos(ev);
    }
    const size = this.placeholderSize();
    if (size && size >= 2 && (size & (size - 1)) === 0) {
      return this.buildPlaceholders(size);
    }
    return [];
  });

  readonly layout = computed<{
    nodes: readonly BracketNode[];
    edges: readonly BracketEdge[];
    width: number;
    height: number;
  }>(() => {
    const rounds = this.rounds();
    if (rounds.length === 0) return { nodes: [], edges: [], width: 0, height: 0 };

    const firstRoundCount = rounds[0]!.length;
    const firstRoundPitch = NODE_H + FIRST_ROUND_GAP;
    const totalHeight = PAD_Y * 2 + firstRoundCount * firstRoundPitch - FIRST_ROUND_GAP;

    const nodeById = new Map<number, BracketNode>();
    const nodes: BracketNode[] = [];

    rounds.forEach((round, rIdx) => {
      const x = PAD_X + rIdx * (NODE_W + ROUND_GAP);

      if (rIdx === 0) {
        round.forEach((d, i) => {
          const y = PAD_Y + i * firstRoundPitch;
          const node: BracketNode = { data: d, x, y, round: rIdx };
          nodes.push(node);
          nodeById.set(d.id, node);
        });
      } else {
        round.forEach((d) => {
          const pa = d.parentLocalId != null ? nodeById.get(d.parentLocalId) : null;
          const pb = d.parentVisitanteId != null ? nodeById.get(d.parentVisitanteId) : null;
          let y: number;
          if (pa && pb) y = (pa.y + pb.y) / 2;
          else if (pa) y = pa.y;
          else if (pb) y = pb.y;
          else {
            const last = nodes.filter((n) => n.round === rIdx).pop();
            y = last ? last.y + firstRoundPitch : PAD_Y;
          }
          const node: BracketNode = { data: d, x, y, round: rIdx };
          nodes.push(node);
          nodeById.set(d.id, node);
        });
      }
    });

    const edges: BracketEdge[] = [];
    for (const node of nodes) {
      if (node.round === 0) continue;
      const parents = [node.data.parentLocalId, node.data.parentVisitanteId]
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
        edges.push({ d, from: p.data.id, to: node.data.id });
      }
    }

    const width = PAD_X * 2 + rounds.length * NODE_W + (rounds.length - 1) * ROUND_GAP;

    let maxY = 0;
    for (const n of nodes) if (n.y + NODE_H > maxY) maxY = n.y + NODE_H;
    const height = Math.max(totalHeight, maxY + PAD_Y);

    return { nodes, edges, width, height };
  });

  onClick(n: BracketNodeData): void {
    if (n.realEvento) this.eventClick.emit(n.realEvento);
  }

  roundLabel(roundIndex: number, totalRounds: number): string {
    const remaining = totalRounds - roundIndex;
    if (remaining === 1) return 'Final';
    if (remaining === 2) return 'Semifinal';
    if (remaining === 3) return 'Cuartos';
    if (remaining === 4) return 'Octavos';
    if (remaining === 5) return 'Dieciseisavos';
    return `Ronda ${roundIndex + 1}`;
  }

  winnerSide(n: BracketNodeData): 'home' | 'away' | null {
    if (n.state !== 'finalized') return null;
    const rl = n.homeScore ?? 0;
    const rv = n.awayScore ?? 0;
    if (rl > rv) return 'home';
    if (rv > rl) return 'away';
    return null;
  }

  // ============== builders ==============

  private buildFromEventos(ev: readonly Evento[]): readonly (readonly BracketNodeData[])[] {
    const byJornada = new Map<number, Evento[]>();
    for (const e of ev) {
      const j = e.jornada ?? 0;
      if (!byJornada.has(j)) byJornada.set(j, []);
      byJornada.get(j)!.push(e);
    }
    const jornadas = [...byJornada.keys()].sort((a, b) => a - b);
    return jornadas.map((j) =>
      byJornada
        .get(j)!
        .sort((a, b) => (a.numeroPartido ?? 0) - (b.numeroPartido ?? 0))
        .map((e) => this.toNodeData(e)),
    );
  }

  private toNodeData(e: Evento): BracketNodeData {
    let state: BracketNodeData['state'] = 'pending';
    if (e.estado === EstadoEvento.FINALIZADO) state = 'finalized';
    else if (e.estado === EstadoEvento.EN_CURSO) state = 'live';
    return {
      id: e.id,
      round: e.jornada ?? 0,
      numeroPartido: e.numeroPartido,
      parentLocalId: e.partidoAnteriorLocalId,
      parentVisitanteId: e.partidoAnteriorVisitanteId,
      homeLabel: e.equipoLocal?.nombre ?? 'TBD',
      awayLabel: e.equipoVisitante?.nombre ?? 'TBD',
      homeScore: e.resultadoLocal,
      awayScore: e.resultadoVisitante,
      state,
      realEvento: e,
    };
  }

  /**
   * Genera un bracket virtual con seeding estándar para N equipos (potencia de 2).
   * Primera ronda con "1º vs Nº", "2º vs (N-1)º"... rondas siguientes TBD.
   */
  private buildPlaceholders(n: number): readonly (readonly BracketNodeData[])[] {
    const pairings = buildPairings(n);
    const rounds: BracketNodeData[][] = [];
    let idCounter = 1;

    // Primera ronda con seeds reales.
    const firstRound: BracketNodeData[] = pairings.map((pair, idx) => ({
      id: idCounter++,
      round: 1,
      numeroPartido: idx + 1,
      homeLabel: ordinal(pair[0]),
      awayLabel: ordinal(pair[1]),
      state: 'placeholder',
    }));
    rounds.push(firstRound);

    // Rondas siguientes: TBD vs TBD, con enlaces a los nodos padres.
    let prev = firstRound;
    let matchesLeft = prev.length / 2;
    while (matchesLeft >= 1) {
      const round: BracketNodeData[] = [];
      for (let i = 0; i < matchesLeft; i++) {
        const pa = prev[i * 2]!;
        const pb = prev[i * 2 + 1]!;
        round.push({
          id: idCounter++,
          round: rounds.length + 1,
          numeroPartido: i + 1,
          parentLocalId: pa.id,
          parentVisitanteId: pb.id,
          homeLabel: 'TBD',
          awayLabel: 'TBD',
          state: 'placeholder',
        });
      }
      rounds.push(round);
      prev = round;
      if (matchesLeft === 1) break;
      matchesLeft = matchesLeft / 2;
    }

    return rounds;
  }
}
