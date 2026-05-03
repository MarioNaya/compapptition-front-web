import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { JugadorService } from './jugador.service';
import { environment } from '@env/environment';

const BASE = `${environment.apiUrl}/jugadores`;

describe('JugadorService', () => {
  let svc: JugadorService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(JugadorService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('buscar$: GET /jugadores/buscar con filtros como query', () => {
    svc.buscar$({ nombre: 'pepe' } as never).subscribe();
    const req = http.expectOne((r) => r.url === `${BASE}/buscar`);
    expect(req.request.method).toBe('GET');
  });

  it('findSimple$: GET /jugadores/simple/{id} y findDetalle$: GET /jugadores/detalle/{id}', () => {
    svc.findSimple$(7).subscribe();
    expect(http.expectOne(`${BASE}/simple/7`).request.method).toBe('GET');
    svc.findDetalle$(7).subscribe();
    expect(http.expectOne(`${BASE}/detalle/7`).request.method).toBe('GET');
  });

  it('CRUD: POST base, PUT id, DELETE id', () => {
    svc.create$({} as never).subscribe();
    expect(http.expectOne(BASE).request.method).toBe('POST');
    svc.update$(7, {} as never).subscribe();
    expect(http.expectOne(`${BASE}/7`).request.method).toBe('PUT');
    svc.delete$(7).subscribe();
    expect(http.expectOne(`${BASE}/7`).request.method).toBe('DELETE');
  });

  it('vincularConUsuario$: POST /jugadores/{id}/vincular/{usuarioId}', () => {
    svc.vincularConUsuario$(7, 99).subscribe();
    expect(http.expectOne(`${BASE}/7/vincular/99`).request.method).toBe('POST');
  });
});
