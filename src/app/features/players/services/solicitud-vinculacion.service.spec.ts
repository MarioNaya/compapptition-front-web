import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SolicitudVinculacionService } from './solicitud-vinculacion.service';
import { environment } from '@env/environment';

const ROOT = environment.apiUrl;

describe('SolicitudVinculacionService', () => {
  let svc: SolicitudVinculacionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(SolicitudVinculacionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('iniciarComoAdmin$: POST /jugadores/{jugadorId}/solicitudes-vinculacion', () => {
    svc.iniciarComoAdmin$(7, {} as never).subscribe();
    expect(http.expectOne(`${ROOT}/jugadores/7/solicitudes-vinculacion`).request.method).toBe('POST');
  });

  it('iniciarComoUsuario$: POST /jugadores/{jugadorId}/solicitudes-vinculacion/auto', () => {
    svc.iniciarComoUsuario$(7, {} as never).subscribe();
    expect(http.expectOne(`${ROOT}/jugadores/7/solicitudes-vinculacion/auto`).request.method).toBe('POST');
  });

  it('aceptar$ y rechazar$: POST /solicitudes-vinculacion/{id}/(aceptar|rechazar)', () => {
    svc.aceptar$(9).subscribe();
    expect(http.expectOne(`${ROOT}/solicitudes-vinculacion/9/aceptar`).request.method).toBe('POST');
    svc.rechazar$(9).subscribe();
    expect(http.expectOne(`${ROOT}/solicitudes-vinculacion/9/rechazar`).request.method).toBe('POST');
  });

  it('pendientes$: GET /solicitudes-vinculacion/pendientes', () => {
    svc.pendientes$().subscribe();
    expect(http.expectOne(`${ROOT}/solicitudes-vinculacion/pendientes`).request.method).toBe('GET');
  });
});
