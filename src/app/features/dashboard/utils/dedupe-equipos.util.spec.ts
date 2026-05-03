import { dedupeEquipos } from './dedupe-equipos.util';
import { Equipo } from '@core/models/equipo/equipo.model';

function eq(id: number, nombre = `Eq${id}`): Equipo {
  return { id, nombre } as Equipo;
}

describe('dedupeEquipos', () => {
  it('lista vacía cuando no hay equipos en ninguna fuente', () => {
    expect(dedupeEquipos([], [], [])).toEqual([]);
  });

  it('etiqueta como "Creador" los que vienen de la fuente de creados', () => {
    const out = dedupeEquipos([eq(1)], [], []);
    expect(out).toEqual([{ id: 1, nombre: 'Eq1', rol: 'Creador' } as never]);
  });

  it('etiqueta como "Manager" o "Jugador" cuando NO viene de creados', () => {
    const out = dedupeEquipos([], [eq(2)], [eq(3)]);
    expect(out.length).toBe(2);
    expect(out.find((e) => e.id === 2)?.rol).toBe('Manager');
    expect(out.find((e) => e.id === 3)?.rol).toBe('Jugador');
  });

  it('prioridad Creador > Manager > Jugador cuando un equipo aparece en varias fuentes', () => {
    const out = dedupeEquipos([eq(7)], [eq(7)], [eq(7)]);
    expect(out.length).toBe(1);
    expect(out[0].rol).toBe('Creador');
  });

  it('prioridad Manager > Jugador cuando NO está en creados pero sí en manager y jugador', () => {
    const out = dedupeEquipos([], [eq(7)], [eq(7)]);
    expect(out.length).toBe(1);
    expect(out[0].rol).toBe('Manager');
  });

  it('preserva el orden creados → managers → jugadores cuando no hay solapes', () => {
    const out = dedupeEquipos([eq(1)], [eq(2)], [eq(3)]);
    expect(out.map((e) => e.id)).toEqual([1, 2, 3]);
  });

  it('deduplicación por id estable (no inserta duplicados aunque cambien atributos)', () => {
    const a = { ...eq(5), nombre: 'A' };
    const b = { ...eq(5), nombre: 'B' };
    const out = dedupeEquipos([a], [b], []);
    expect(out.length).toBe(1);
    expect(out[0].nombre).toBe('A'); // gana el de creados (entró primero)
  });
});
