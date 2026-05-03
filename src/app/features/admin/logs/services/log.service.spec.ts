import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LogService } from './log.service';
import { environment } from '@env/environment';

const BASE = `${environment.apiUrl}/logs`;

describe('LogService', () => {
  let svc: LogService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(LogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('findByCompeticion$: GET /logs/competicion/{id}', () => {
    svc.findByCompeticion$(7).subscribe();
    expect(http.expectOne((r) => r.url === `${BASE}/competicion/7`).request.method).toBe('GET');
  });

  it('findByUsuario$: GET /logs/usuario/{id}', () => {
    svc.findByUsuario$(7).subscribe();
    expect(http.expectOne((r) => r.url === `${BASE}/usuario/7`).request.method).toBe('GET');
  });

  it('findByEntidad$: GET /logs/entidad/{entidad}/{entidadId}', () => {
    svc.findByEntidad$('competicion', 7).subscribe();
    expect(http.expectOne(`${BASE}/entidad/competicion/7`).request.method).toBe('GET');
  });
});
