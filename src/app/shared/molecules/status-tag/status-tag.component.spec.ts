import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusTagComponent } from './status-tag.component';
import { EstadoCompeticion } from '@core/models/competicion/competicion.model';
import { EstadoEvento } from '@core/models/evento/evento.model';

describe('StatusTagComponent', () => {
  let fixture: ComponentFixture<StatusTagComponent>;
  let cmp: StatusTagComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [StatusTagComponent] });
    fixture = TestBed.createComponent(StatusTagComponent);
    cmp = fixture.componentInstance;
  });

  function setState(state: string): void {
    fixture.componentRef.setInput('state', state);
    fixture.detectChanges();
  }

  it('mapea EstadoCompeticion.ACTIVA → "En curso" / paleta naranja', () => {
    setState(EstadoCompeticion.ACTIVA);
    expect(cmp.label()).toBe('En curso');
    expect(cmp.palette().tag).toBe('orange');
  });

  it('mapea EstadoEvento.FINALIZADO → "Finalizado" / paleta gris', () => {
    setState(EstadoEvento.FINALIZADO);
    expect(cmp.label()).toBe('Finalizado');
    expect(cmp.palette().tag).toBe('gray');
  });

  it('mapea CANCELADA / SUSPENDIDO → paleta roja', () => {
    setState(EstadoCompeticion.CANCELADA);
    expect(cmp.palette().tag).toBe('red');
    setState(EstadoEvento.SUSPENDIDO);
    expect(cmp.palette().tag).toBe('red');
  });

  it('estado desconocido: label = el propio estado y paleta gris por defecto', () => {
    setState('LO_QUE_SEA');
    expect(cmp.label()).toBe('LO_QUE_SEA');
    expect(cmp.palette().tag).toBe('gray');
  });
});
