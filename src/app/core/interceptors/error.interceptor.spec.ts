import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';
import { M } from '@shared/messages';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('para 4xx con mensaje de negocio: propaga el message del backend', (done) => {
    http.get('/api/x').subscribe({
      next: () => done.fail('debería haber fallado'),
      error: (err: { status: number; message: string }) => {
        expect(err.status).toBe(400);
        expect(err.message).toBe('Datos inválidos para la operación solicitada');
        done();
      },
    });

    controller.expectOne('/api/x').flush(
      { message: 'Datos inválidos para la operación solicitada' },
      { status: 400, statusText: 'Bad Request' },
    );
  });

  it('para 4xx sin mensaje del backend: usa el genérico de M.generic.genericError', (done) => {
    http.get('/api/x').subscribe({
      next: () => done.fail('debería haber fallado'),
      error: (err: { status: number; message: string }) => {
        expect(err.status).toBe(404);
        expect(err.message).toBe(M.generic.genericError);
        done();
      },
    });

    controller.expectOne('/api/x').flush(null, { status: 404, statusText: 'Not Found' });
  });

  it('para 5xx: usa el mensaje de servidor (M.network.serverError) ignorando el body', (done) => {
    http.get('/api/x').subscribe({
      next: () => done.fail('debería haber fallado'),
      error: (err: { status: number; message: string }) => {
        expect(err.status).toBe(500);
        expect(err.message).toBe(M.network.serverError);
        done();
      },
    });

    controller.expectOne('/api/x').flush(
      { message: 'java.lang.NullPointerException' },
      { status: 500, statusText: 'Internal Server Error' },
    );
  });

  it('para 408/504: usa el mensaje de timeout', (done) => {
    http.get('/api/x').subscribe({
      next: () => done.fail('debería haber fallado'),
      error: (err: { status: number; message: string }) => {
        expect(err.status).toBe(504);
        expect(err.message).toBe(M.network.timeout);
        done();
      },
    });

    controller.expectOne('/api/x').flush(null, { status: 504, statusText: 'Gateway Timeout' });
  });

  it('para status 0 con navigator online: serverUnreachable', (done) => {
    spyOnProperty(navigator, 'onLine').and.returnValue(true);

    http.get('/api/x').subscribe({
      next: () => done.fail('debería haber fallado'),
      error: (err: { status: number; message: string }) => {
        expect(err.status).toBe(0);
        expect(err.message).toBe(M.network.serverUnreachable);
        done();
      },
    });

    controller.expectOne('/api/x').flush(null, { status: 0, statusText: 'Unknown' });
  });

  it('preserva validationErrors del backend para que el formulario los pinte por campo', (done) => {
    http.post('/api/x', {}).subscribe({
      next: () => done.fail('debería haber fallado'),
      error: (err: { errors?: Record<string, string> }) => {
        expect(err.errors).toEqual({ email: 'El email ya está registrado' });
        done();
      },
    });

    controller.expectOne('/api/x').flush(
      {
        message: 'Validación',
        validationErrors: { email: 'El email ya está registrado' },
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
  });
});
