import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EquipoService } from './equipo.service';
import { environment } from '@env/environment';

const BASE = `${environment.apiUrl}/equipos`;
const COMP = `${environment.apiUrl}/competiciones`;

describe('EquipoService', () => {
  let svc: EquipoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    svc = TestBed.inject(EquipoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('findByCodigo$: GET /equipos/codigo/{codigo} con encodeURIComponent', () => {
    svc.findByCodigo$('A B+C').subscribe();
    expect(http.expectOne(`${BASE}/codigo/A%20B%2BC`).request.method).toBe('GET');
  });

  it('mis-equipos: manager, jugador, creados (3 endpoints distintos)', () => {
    svc.misEquiposManager$().subscribe();
    expect(http.expectOne(`${BASE}/mis-equipos/manager`).request.method).toBe('GET');
    svc.misEquiposJugador$().subscribe();
    expect(http.expectOne(`${BASE}/mis-equipos/jugador`).request.method).toBe('GET');
    svc.misEquiposCreados$().subscribe();
    expect(http.expectOne(`${BASE}/mis-equipos/creados`).request.method).toBe('GET');
  });

  it('create$ POST /equipos, update$ PUT /equipos/{id}, delete$ DELETE /equipos/{id}', () => {
    svc.create$({} as never).subscribe();
    expect(http.expectOne(BASE).request.method).toBe('POST');
    svc.update$(7, {} as never).subscribe();
    expect(http.expectOne(`${BASE}/7`).request.method).toBe('PUT');
    svc.delete$(7).subscribe();
    expect(http.expectOne(`${BASE}/7`).request.method).toBe('DELETE');
  });

  it('inscribirEnCompeticion$: POST /competiciones/{id}/equipos/{equipoId}', () => {
    svc.inscribirEnCompeticion$(1, 2).subscribe();
    expect(http.expectOne(`${COMP}/1/equipos/2`).request.method).toBe('POST');
  });

  it('retirarDeCompeticion$: DELETE /competiciones/{id}/equipos/{equipoId}', () => {
    svc.retirarDeCompeticion$(1, 2).subscribe();
    expect(http.expectOne(`${COMP}/1/equipos/2`).request.method).toBe('DELETE');
  });

  it('regenerarCodigo$: POST /equipos/{id}/codigo-invitacion/regenerar', () => {
    svc.regenerarCodigo$(7).subscribe();
    expect(http.expectOne(`${BASE}/7/codigo-invitacion/regenerar`).request.method).toBe('POST');
  });

  it('agregarJugador$: POST /equipos/{equipoId}/jugadores/{jugadorId}', () => {
    svc.agregarJugador$(7, 8).subscribe();
    expect(http.expectOne(`${BASE}/7/jugadores/8`).request.method).toBe('POST');
  });

  it('actualizarDorsal$: PATCH /equipos/{id}/jugadores/{jugadorId}/dorsal con dorsal en query', () => {
    svc.actualizarDorsal$(7, 8, 10).subscribe();
    const req = http.expectOne((r) =>
      r.url === `${BASE}/7/jugadores/8/dorsal` && r.params.get('dorsal') === '10',
    );
    expect(req.request.method).toBe('PATCH');
  });
});
