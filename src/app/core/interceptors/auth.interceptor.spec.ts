import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpHandlerFn, HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '@core/services/auth.service';
import { environment } from '@env/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let authMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authMock = jasmine.createSpyObj<AuthService>('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('añade Authorization Bearer cuando la URL es del backend y hay token', () => {
    authMock.getToken.and.returnValue('tok-abc');

    http.get(`${environment.apiUrl}/usuarios/me`).subscribe();

    const req = controller.expectOne(`${environment.apiUrl}/usuarios/me`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-abc');
    req.flush({});
  });

  it('NO añade Authorization cuando la URL no es del backend (allow-list por apiUrl)', () => {
    authMock.getToken.and.returnValue('tok-abc');

    http.get('https://res.cloudinary.com/foo/image.png').subscribe();

    const req = controller.expectOne('https://res.cloudinary.com/foo/image.png');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
  });

  it('NO añade Authorization si el AuthService no tiene token aunque la URL sea del backend', () => {
    authMock.getToken.and.returnValue(null);

    http.get(`${environment.apiUrl}/competiciones/publicas/simple`).subscribe();

    const req = controller.expectOne(`${environment.apiUrl}/competiciones/publicas/simple`);
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
  });

  it('no consulta el token cuando la URL es externa (lazy: corta antes)', () => {
    authMock.getToken.and.returnValue('tok-abc');

    // Caso de URL externa: el interceptor cortocircuita y nunca pide el token.
    const externalReq = new HttpRequest('GET', 'https://api.openstreetmap.org/foo');
    let called = false;
    const fakeNext: HttpHandlerFn = (r) => {
      called = true;
      expect(r.headers.get('Authorization')).toBeNull();
      return new (TestBed.inject(HttpTestingController) as any).constructor() as never;
    };

    // Reusamos el HttpClient para simular el flujo real: la única forma fiable
    // de comprobar lazy es vía http.get y mirar que getToken NO se invoque.
    authMock.getToken.calls.reset();
    http.get('https://api.openstreetmap.org/foo').subscribe({ error: () => {} });
    const r = controller.expectOne('https://api.openstreetmap.org/foo');
    r.flush({});

    expect(authMock.getToken).not.toHaveBeenCalled();
    expect(called).toBeFalse(); // sanity: el fakeNext de arriba era simulado, no debe haberse usado
  });
});
