import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayoffBracketComponent } from './playoff-bracket.component';
import { Evento, EstadoEvento } from '@core/models/evento/evento.model';

describe('PlayoffBracketComponent — computed signals (rounds + layout)', () => {
  let fixture: ComponentFixture<PlayoffBracketComponent>;
  let cmp: PlayoffBracketComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PlayoffBracketComponent] });
    fixture = TestBed.createComponent(PlayoffBracketComponent);
    cmp = fixture.componentInstance;
  });

  function setInputs(eventos: readonly Evento[], placeholderSize: number | null = null): void {
    fixture.componentRef.setInput('eventos', eventos);
    fixture.componentRef.setInput('placeholderSize', placeholderSize);
    fixture.detectChanges();
  }

  function evt(over: Partial<Evento>): Evento {
    return {
      id: 1,
      jornada: 1,
      numeroPartido: 1,
      estado: EstadoEvento.PROGRAMADO,
      bloqueado: false,
      equipoLocal: { id: 100, nombre: 'L' } as never,
      equipoVisitante: { id: 200, nombre: 'V' } as never,
      fechaHora: '2026-05-03T10:00:00Z',
      ...over,
    } as unknown as Evento;
  }

  it('rounds vacías cuando no hay eventos ni placeholderSize', () => {
    setInputs([]);
    expect(cmp.rounds()).toEqual([]);
    expect(cmp.layout().nodes).toEqual([]);
    expect(cmp.layout().edges).toEqual([]);
  });

  it('placeholderSize=4 → 2 rondas (semis 2 + final 1) con seeds 1º vs 4º y 2º vs 3º', () => {
    setInputs([], 4);
    const r = cmp.rounds();
    expect(r.length).toBe(2);
    expect(r[0].length).toBe(2);
    expect(r[1].length).toBe(1);

    const seeds = r[0].map((n) => `${n.homeLabel} vs ${n.awayLabel}`);
    expect(seeds).toContain('1º vs 4º');
    expect(seeds).toContain('2º vs 3º');

    expect(r[1][0].homeLabel).toBe('TBD');
    expect(r[1][0].awayLabel).toBe('TBD');
  });

  it('placeholderSize=8 → 3 rondas (cuartos 4 + semis 2 + final 1)', () => {
    setInputs([], 8);
    const r = cmp.rounds();
    expect(r.length).toBe(3);
    expect(r[0].length).toBe(4);
    expect(r[1].length).toBe(2);
    expect(r[2].length).toBe(1);
  });

  it('placeholderSize NO potencia de 2 → rounds vacías (no construye)', () => {
    setInputs([], 6);
    expect(cmp.rounds()).toEqual([]);
  });

  it('eventos sin parents: agrupa por jornada', () => {
    const eventos: Evento[] = [
      evt({ id: 1, jornada: 1, numeroPartido: 1 }),
      evt({ id: 2, jornada: 1, numeroPartido: 2 }),
      evt({ id: 3, jornada: 2, numeroPartido: 1 }),
    ];
    setInputs(eventos);
    const r = cmp.rounds();
    expect(r.length).toBe(2);
    expect(r[0].length).toBe(2);
    expect(r[1].length).toBe(1);
  });

  it('eventos con parents: la final (sin hijos parent) cae en la última ronda', () => {
    const eventos: Evento[] = [
      evt({ id: 1, jornada: 1, numeroPartido: 1 }),
      evt({ id: 2, jornada: 1, numeroPartido: 2 }),
      evt({
        id: 3, jornada: 2, numeroPartido: 1,
        partidoAnteriorLocalId: 1, partidoAnteriorVisitanteId: 2,
      }),
    ];
    setInputs(eventos);
    const r = cmp.rounds();
    expect(r.length).toBe(2);
    // La ronda 0 contiene los partidos parent (1 y 2); la 1 contiene la final (3).
    expect(r[0].map((n) => n.id).sort()).toEqual([1, 2]);
    expect(r[1].map((n) => n.id)).toEqual([3]);
  });

  it('layout produce un nodo por BracketNodeData y posiciones x/y deterministas', () => {
    setInputs([], 4);
    const layout = cmp.layout();
    expect(layout.nodes.length).toBe(3); // 2 semis + 1 final
    // Semifinales mismas x; final con x mayor.
    const semifinales = layout.nodes.filter((n) => n.round === 0);
    const final = layout.nodes.filter((n) => n.round === 1);
    expect(semifinales.length).toBe(2);
    expect(final.length).toBe(1);
    expect(final[0].x).toBeGreaterThan(semifinales[0].x);
  });

  it('layout dibuja edges sólo entre rondas (no en la primera)', () => {
    setInputs([], 4);
    const layout = cmp.layout();
    // 4 → 2 → 1: 2 edges entrantes a la final desde las 2 semis.
    expect(layout.edges.length).toBe(2);
  });

  it('roundLabel: nombra Final / Semifinal / Cuartos por proximidad', () => {
    expect(cmp.roundLabel(0, 1)).toBe('Final');
    expect(cmp.roundLabel(0, 2)).toBe('Semifinal');
    expect(cmp.roundLabel(0, 3)).toBe('Cuartos');
    expect(cmp.roundLabel(0, 4)).toBe('Octavos');
    expect(cmp.roundLabel(0, 5)).toBe('Dieciseisavos');
    // remaining > 5 cae en el fallback "Ronda N+1"
    expect(cmp.roundLabel(1, 10)).toBe('Ronda 2');
  });
});
