import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatchRowComponent } from './match-row.component';
import { Evento, EstadoEvento } from '@core/models/evento/evento.model';

function evt(): Evento {
  return {
    id: 1, jornada: 1, numeroPartido: 1, estado: EstadoEvento.PROGRAMADO,
    bloqueado: false,
    equipoLocal: { id: 100, nombre: 'L' } as never,
    equipoVisitante: { id: 200, nombre: 'V' } as never,
    fechaHora: '2026-05-03T10:00:00Z',
  } as unknown as Evento;
}

describe('MatchRowComponent', () => {
  let fixture: ComponentFixture<MatchRowComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [MatchRowComponent] });
    fixture = TestBed.createComponent(MatchRowComponent);
    fixture.componentRef.setInput('evento', evt());
  });

  it('open() emite el evento que recibe por input', (done) => {
    fixture.componentInstance.opened.subscribe((e) => {
      expect(e.id).toBe(1);
      done();
    });
    // No llamamos fixture.detectChanges(): evita renderizar el template
    // (que usa DatePipe con LOCALE_ID 'es' no registrado en el TestBed).
    // open() emite el output sin necesidad de pintar el componente.
    fixture.componentInstance.open();
  });
});
