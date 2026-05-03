import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DeporteService } from './deporte.service';
import { environment } from '@env/environment';

const BASE = `${environment.apiUrl}/deportes`;

describe('DeporteService', () => {
  let svc: DeporteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(DeporteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('findAll$, findById$, findTiposEstadistica$ apuntan a las URLs correctas', () => {
    svc.findAll$().subscribe();
    expect(http.expectOne(BASE).request.method).toBe('GET');

    svc.findById$(7).subscribe();
    expect(http.expectOne(`${BASE}/7`).request.method).toBe('GET');

    svc.findTiposEstadistica$(7).subscribe();
    expect(http.expectOne(`${BASE}/7/estadisticas`).request.method).toBe('GET');
  });

  it('create$ POST base, update$ PUT id, delete$ DELETE id', () => {
    svc.create$({} as never).subscribe();
    expect(http.expectOne(BASE).request.method).toBe('POST');
    svc.update$(7, {} as never).subscribe();
    expect(http.expectOne(`${BASE}/7`).request.method).toBe('PUT');
    svc.delete$(7).subscribe();
    expect(http.expectOne(`${BASE}/7`).request.method).toBe('DELETE');
  });
});
