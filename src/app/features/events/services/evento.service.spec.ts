import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EventoService } from './evento.service';
import { environment } from '@env/environment';

const ROOT = `${environment.apiUrl}/competiciones`;

describe('EventoService', () => {
  let svc: EventoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(EventoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('findByCompeticion$: GET /competiciones/{id}/eventos/detalle', () => {
    svc.findByCompeticion$(7).subscribe();
    expect(http.expectOne(`${ROOT}/7/eventos/detalle`).request.method).toBe('GET');
  });

  it('findSimpleByCompeticion$: GET /eventos/simple', () => {
    svc.findSimpleByCompeticion$(7).subscribe();
    expect(http.expectOne(`${ROOT}/7/eventos/simple`).request.method).toBe('GET');
  });

  it('findByJornada$: GET /eventos/jornada/{j}/detalle', () => {
    svc.findByJornada$(7, 3).subscribe();
    expect(http.expectOne(`${ROOT}/7/eventos/jornada/3/detalle`).request.method).toBe('GET');
  });

  it('findByEquipo$: GET /eventos/equipo/{equipoId}', () => {
    svc.findByEquipo$(7, 99).subscribe();
    expect(http.expectOne(`${ROOT}/7/eventos/equipo/99`).request.method).toBe('GET');
  });

  it('CRUD: GET id, POST create, PUT update, DELETE delete', () => {
    svc.findById$(1, 9).subscribe();
    expect(http.expectOne(`${ROOT}/1/eventos/9`).request.method).toBe('GET');

    svc.create$(1, {} as never).subscribe();
    expect(http.expectOne(`${ROOT}/1/eventos`).request.method).toBe('POST');

    svc.update$(1, 9, {} as never).subscribe();
    expect(http.expectOne(`${ROOT}/1/eventos/9`).request.method).toBe('PUT');

    svc.delete$(1, 9).subscribe();
    expect(http.expectOne(`${ROOT}/1/eventos/9`).request.method).toBe('DELETE');
  });

  it('registrarResultado$: POST /eventos/{id}/resultado', () => {
    svc.registrarResultado$(1, 9, {} as never).subscribe();
    expect(http.expectOne(`${ROOT}/1/eventos/9/resultado`).request.method).toBe('POST');
  });

  it('cambiarEstado$: PATCH /eventos/{id}/estado con query estado', () => {
    svc.cambiarEstado$(1, 9, 'FINALIZADO').subscribe();
    const req = http.expectOne((r) =>
      r.url === `${ROOT}/1/eventos/9/estado` && r.params.get('estado') === 'FINALIZADO',
    );
    expect(req.request.method).toBe('PATCH');
  });

  it('notificarJugadores$: POST /eventos/{id}/notificar-jugadores', () => {
    svc.notificarJugadores$(1, 9).subscribe();
    expect(http.expectOne(`${ROOT}/1/eventos/9/notificar-jugadores`).request.method).toBe('POST');
  });
});
