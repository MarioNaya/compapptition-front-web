import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TipoEstadisticaService } from './tipo-estadistica.service';
import { environment } from '@env/environment';

const BASE = `${environment.apiUrl}/tipos-estadistica`;

describe('TipoEstadisticaService', () => {
  let svc: TipoEstadisticaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(TipoEstadisticaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('findByDeporte$: GET /tipos-estadistica/deporte/{id}', () => {
    svc.findByDeporte$(7).subscribe();
    expect(http.expectOne(`${BASE}/deporte/7`).request.method).toBe('GET');
  });

  it('findById$, update$ y delete$ usan /tipos-estadistica/{id}', () => {
    svc.findById$(9).subscribe();
    expect(http.expectOne(`${BASE}/9`).request.method).toBe('GET');
    svc.update$(9, {} as never).subscribe();
    expect(http.expectOne(`${BASE}/9`).request.method).toBe('PUT');
    svc.delete$(9).subscribe();
    expect(http.expectOne(`${BASE}/9`).request.method).toBe('DELETE');
  });

  it('create$: POST /tipos-estadistica/deporte/{deporteId} con el request en body', () => {
    svc.create$(7, {} as never).subscribe();
    expect(http.expectOne(`${BASE}/deporte/7`).request.method).toBe('POST');
  });
});
