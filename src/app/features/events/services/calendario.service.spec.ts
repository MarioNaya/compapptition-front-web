import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CalendarioService } from './calendario.service';
import { environment } from '@env/environment';

const ROOT = `${environment.apiUrl}/competiciones`;

describe('CalendarioService', () => {
  let svc: CalendarioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(CalendarioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('generar$: POST /competiciones/{id}/calendario', () => {
    svc.generar$(7, {} as never).subscribe();
    expect(http.expectOne(`${ROOT}/7/calendario`).request.method).toBe('POST');
  });

  it('generarPlayoff$: POST /competiciones/{id}/calendario/playoff', () => {
    svc.generarPlayoff$(7, {} as never).subscribe();
    expect(http.expectOne(`${ROOT}/7/calendario/playoff`).request.method).toBe('POST');
  });

  it('propaga error 500 sin tocarlo', (done) => {
    svc.generar$(7, {} as never).subscribe({
      next: () => done.fail('debería haber fallado'),
      error: (e) => { expect(e.status).toBe(500); done(); },
    });
    http.expectOne(`${ROOT}/7/calendario`).flush(null, { status: 500, statusText: 'Server' });
  });
});
