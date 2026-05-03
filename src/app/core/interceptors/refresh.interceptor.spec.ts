import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { refreshInterceptor } from './refresh.interceptor';
import { AuthService } from '@core/services/auth.service';
import { environment } from '@env/environment';
import { AuthResponse } from '@core/models/usuario';

describe('refreshInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let authMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authMock = jasmine.createSpyObj<AuthService>('AuthService', [
      'refreshToken',
      'clearSession',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([refreshInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('propaga el error sin disparar refresh cuando el status no es 401', (done) => {
    http.get(`${environment.apiUrl}/competiciones`).subscribe({
      next: () => done.fail('debería haber fallado'),
      error: (err) => {
        expect(err.status).toBe(500);
        expect(authMock.refreshToken).not.toHaveBeenCalled();
        done();
      },
    });

    controller
      .expectOne(`${environment.apiUrl}/competiciones`)
      .flush(null, { status: 500, statusText: 'Internal Server Error' });
  });

  it('NO maneja 401 en endpoints /auth/* (login fallido devuelve 401 y no debe disparar refresh)', (done) => {
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({
      next: () => done.fail('debería haber fallado'),
      error: (err) => {
        expect(err.status).toBe(401);
        expect(authMock.refreshToken).not.toHaveBeenCalled();
        done();
      },
    });

    controller
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('NO maneja 401 en URLs externas (no son del backend)', (done) => {
    http.get('https://res.cloudinary.com/foo').subscribe({
      next: () => done.fail('debería haber fallado'),
      error: (err) => {
        expect(err.status).toBe(401);
        expect(authMock.refreshToken).not.toHaveBeenCalled();
        done();
      },
    });

    controller
      .expectOne('https://res.cloudinary.com/foo')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('en 401 con refresh OK: reintenta la petición con el nuevo token y devuelve la respuesta', (done) => {
    const authResponse: AuthResponse = {
      accessToken: 'new-token-xyz',
      tokenType: 'Bearer',
      expiresIn: 900,
      usuario: {
        id: 1, username: 'u', email: 'u@x.com', activo: true,
        esAdminSistema: false, rolesCompeticion: [],
      },
    };
    authMock.refreshToken.and.returnValue(of(authResponse));

    http.get(`${environment.apiUrl}/usuarios/me`).subscribe({
      next: (body: unknown) => {
        expect(body).toEqual({ id: 1 });
        expect(authMock.refreshToken).toHaveBeenCalledTimes(1);
        expect(authMock.clearSession).not.toHaveBeenCalled();
        done();
      },
      error: () => done.fail('debería haber tenido éxito tras el refresh'),
    });

    // Primera petición: 401.
    controller
      .expectOne(`${environment.apiUrl}/usuarios/me`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    // Reintento: ahora con el nuevo token.
    const retry = controller.expectOne(`${environment.apiUrl}/usuarios/me`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token-xyz');
    retry.flush({ id: 1 });
  });

  it('en 401 con refresh KO: llama clearSession y propaga el error del refresh', (done) => {
    authMock.refreshToken.and.returnValue(
      throwError(() => ({ status: 401, message: 'refresh fallido' })),
    );

    http.get(`${environment.apiUrl}/usuarios/me`).subscribe({
      next: () => done.fail('debería haber fallado'),
      error: (err) => {
        expect(authMock.refreshToken).toHaveBeenCalledTimes(1);
        expect(authMock.clearSession).toHaveBeenCalledTimes(1);
        // El error que propaga es el del refresh, no el 401 original.
        expect(err.message).toBe('refresh fallido');
        done();
      },
    });

    controller
      .expectOne(`${environment.apiUrl}/usuarios/me`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
  });
});
