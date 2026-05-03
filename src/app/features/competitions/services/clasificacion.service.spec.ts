import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ClasificacionService } from './clasificacion.service';
import { environment } from '@env/environment';

const BASE = `${environment.apiUrl}/clasificaciones`;

describe('ClasificacionService', () => {
  let svc: ClasificacionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(ClasificacionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('findByCompeticionDetalle$: GET /competiciondetalle/{id}', () => {
    svc.findByCompeticionDetalle$(7).subscribe();
    expect(http.expectOne(`${BASE}/competiciondetalle/7`).request.method).toBe('GET');
  });

  it('findByCompeticionSimple$: GET /competicionsimple/{id}', () => {
    svc.findByCompeticionSimple$(7).subscribe();
    expect(http.expectOne(`${BASE}/competicionsimple/7`).request.method).toBe('GET');
  });

  it('recalcular$: POST /competicion/{id}/recalcular', () => {
    svc.recalcular$(7).subscribe();
    expect(http.expectOne(`${BASE}/competicion/7/recalcular`).request.method).toBe('POST');
  });
});
