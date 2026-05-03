import { tieneEquiposVisibles } from './has-teams.util';
import { RolCompeticion } from '@core/models/rol';

describe('tieneEquiposVisibles', () => {
  it('true cuando el usuario ha creado al menos un equipo', () => {
    expect(tieneEquiposVisibles(1, [])).toBeTrue();
    expect(tieneEquiposVisibles(99, undefined)).toBeTrue();
  });

  it('true cuando tiene rol MANAGER_EQUIPO en alguna competición (sin equipos creados)', () => {
    expect(tieneEquiposVisibles(0, [
      { id: 1, nombre: 'Liga', rol: RolCompeticion.MANAGER_EQUIPO },
    ])).toBeTrue();
  });

  it('true cuando tiene rol JUGADOR en alguna competición', () => {
    expect(tieneEquiposVisibles(0, [
      { id: 1, nombre: 'Liga', rol: RolCompeticion.JUGADOR },
    ])).toBeTrue();
  });

  it('false cuando solo tiene roles ADMIN_COMPETICION o ARBITRO (no es team-related)', () => {
    expect(tieneEquiposVisibles(0, [
      { id: 1, nombre: 'L1', rol: RolCompeticion.ADMIN_COMPETICION },
      { id: 2, nombre: 'L2', rol: RolCompeticion.ARBITRO },
    ])).toBeFalse();
  });

  it('false cuando no hay equipos ni roles', () => {
    expect(tieneEquiposVisibles(0, [])).toBeFalse();
    expect(tieneEquiposVisibles(0, undefined)).toBeFalse();
  });
});
