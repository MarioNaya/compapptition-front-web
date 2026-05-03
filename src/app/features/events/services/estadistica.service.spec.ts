import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EstadisticaService } from './estadistica.service';
import { environment } from '@env/environment';

const BASE = `${environment.apiUrl}/estadisticas`;

describe('EstadisticaService', () => {
  let svc: EstadisticaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(EstadisticaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('byJugador$: GET /estadisticas/jugador/{id}', () => {
    svc.byJugador$(7).subscribe();
    expect(http.expectOne(`${BASE}/jugador/7`).request.method).toBe('GET');
  });

  it('byJugadorTemporada$: GET /estadisticas/jugador/{id}/temporada/{t}', () => {
    svc.byJugadorTemporada$(7, 2026).subscribe();
    expect(http.expectOne(`${BASE}/jugador/7/temporada/2026`).request.method).toBe('GET');
  });

  it('byEventoYJugador$: GET con path raro /jugador/{eventoId}/jugador/{jugadorId}', () => {
    svc.byEventoYJugador$(99, 7).subscribe();
    expect(http.expectOne(`${BASE}/jugador/99/jugador/7`).request.method).toBe('GET');
  });

  it('rankingByCompeticion$: GET /competicion/{c}/ranking/{tipo}', () => {
    svc.rankingByCompeticion$(1, 5).subscribe();
    expect(http.expectOne(`${BASE}/competicion/1/ranking/5`).request.method).toBe('GET');
  });

  it('crear$: POST base', () => {
    svc.crear$({} as never).subscribe();
    expect(http.expectOne(BASE).request.method).toBe('POST');
  });
});
