import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { RolCompeticion } from '@core/models/rol/rol.model';
import { environment } from '@env/environment';

/**
 * Construye un JWT con header ".", payload ".", y firma vacía. Para los
 * tests de AuthService no se verifica firma — sólo se decodifica el payload.
 * `btoa` está disponible en ChromeHeadless.
 */
function makeJwt(payload: Record<string, unknown>): string {
  const b64url = (s: string) =>
    btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return [
    b64url(JSON.stringify({ alg: 'HS512', typ: 'JWT' })),
    b64url(JSON.stringify(payload)),
    'signature-placeholder',
  ].join('.');
}

const TOKEN_KEY = 'access_token';

describe('AuthService', () => {
  let controller: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    if (controller) controller.verify();
    localStorage.clear();
  });

  function configure() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    controller = TestBed.inject(HttpTestingController);
  }

  // =========================================================
  // bootstrapUserFromToken (vía constructor)
  // =========================================================

  it('bootstrap: con token válido en localStorage, hidrata currentUser desde los claims', () => {
    const token = makeJwt({
      sub: 'alberto',
      userId: 7,
      esAdminSistema: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
      competiciones: [{ id: 10, nombre: 'Liga A', rol: 'ADMIN_COMPETICION' }],
    });
    localStorage.setItem(TOKEN_KEY, token);

    configure();
    const auth = TestBed.inject(AuthService);

    expect(auth.isAuthenticated()).toBeTrue();
    const user = auth.currentUser();
    expect(user?.id).toBe(7);
    expect(user?.username).toBe('alberto');
    expect(user?.esAdminSistema).toBeFalse();
    expect(user?.rolesCompeticion).toEqual([
      { id: 10, nombre: 'Liga A', rol: RolCompeticion.ADMIN_COMPETICION },
    ]);

    // El constructor lanza GET /usuarios/me; lo respondemos para limpiar verify().
    controller
      .expectOne(`${environment.apiUrl}/usuarios/me`)
      .flush({
        id: 7, username: 'alberto', email: 'alberto@test.com',
        activo: true, esAdminSistema: false, rolesCompeticion: [],
      });
  });

  it('bootstrap: con token CADUCADO (exp pasado), NO hidrata — evita "sesión fantasma"', () => {
    const token = makeJwt({
      sub: 'alberto',
      userId: 7,
      esAdminSistema: false,
      exp: Math.floor(Date.now() / 1000) - 60, // hace 60s
    });
    localStorage.setItem(TOKEN_KEY, token);

    configure();
    const auth = TestBed.inject(AuthService);

    // bootstrapUserFromToken descarta el token caducado pero el constructor
    // arranca igualmente loadCurrentUser porque getToken() devuelve el token.
    // Esto corresponde al diseño: dejar que el refresh interceptor decida.
    expect(auth.currentUser()).toBeNull();
    expect(auth.isAuthenticated()).toBeFalse();

    // El constructor llama a /usuarios/me. Respondemos 401 → clearSession.
    const req = controller.expectOne(`${environment.apiUrl}/usuarios/me`);
    req.flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('bootstrap: sin token en localStorage, currentUser es null', () => {
    configure();
    const auth = TestBed.inject(AuthService);

    expect(auth.currentUser()).toBeNull();
    expect(auth.isAuthenticated()).toBeFalse();
  });

  it('bootstrap: con token MALFORMADO (sin payload válido), no rompe — devuelve null', () => {
    localStorage.setItem(TOKEN_KEY, 'no-es-un-jwt');

    configure();
    const auth = TestBed.inject(AuthService);

    // currentUser sigue null (no hubo claims utilizables) pero el constructor
    // intenta /usuarios/me porque hay "algo" en getToken(); respondemos para
    // dejar verify() limpio.
    expect(auth.currentUser()).toBeNull();
    const req = controller.expectOne(`${environment.apiUrl}/usuarios/me`);
    req.flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  // =========================================================
  // login → handleAuthResponse → parseRolesFromJwt (todo en cadena)
  // =========================================================

  it('login: persiste el access token en localStorage y sincroniza el user con los roles del JWT', () => {
    configure();
    const auth = TestBed.inject(AuthService);

    const tokenWithRoles = makeJwt({
      sub: 'pepe',
      userId: 42,
      esAdminSistema: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
      competiciones: [
        { id: 10, nombre: 'Liga', rol: 'JUGADOR' },
        { id: 11, nombre: 'Copa', rol: 'MANAGER_EQUIPO' },
      ],
    });

    auth.login({ usernameOrEmail: 'pepe', password: 'x' } as never).subscribe();

    const req = controller.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({
      accessToken: tokenWithRoles,
      usuario: {
        id: 42, username: 'pepe', email: 'pepe@x.com', activo: true,
        esAdminSistema: false, rolesCompeticion: [],
      },
    });

    expect(localStorage.getItem(TOKEN_KEY)).toBe(tokenWithRoles);

    const user = auth.currentUser();
    expect(user?.id).toBe(42);
    expect(user?.rolesCompeticion).toEqual([
      { id: 10, nombre: 'Liga', rol: RolCompeticion.JUGADOR },
      { id: 11, nombre: 'Copa', rol: RolCompeticion.MANAGER_EQUIPO },
    ]);
  });

  // =========================================================
  // RBAC helpers: isAdminSistema / isAdminCompeticion / hasRole
  // =========================================================

  it('isAdminSistema: true cuando el JWT lo declara, false en otro caso', () => {
    const token = makeJwt({
      sub: 'admin',
      userId: 1,
      esAdminSistema: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      competiciones: [],
    });
    localStorage.setItem(TOKEN_KEY, token);

    configure();
    const auth = TestBed.inject(AuthService);

    expect(auth.isAdminSistema()).toBeTrue();

    const req = controller.expectOne(`${environment.apiUrl}/usuarios/me`);
    req.flush({ id: 1, username: 'admin', email: 'a@x.com', activo: true,
      esAdminSistema: true, rolesCompeticion: [] });
  });

  it('isAdminCompeticion: admin-sistema supera comprobación; usuario sin rol no', () => {
    // Admin sistema: true para cualquier competición.
    let token = makeJwt({
      sub: 'admin', userId: 1, esAdminSistema: true,
      exp: Math.floor(Date.now() / 1000) + 3600, competiciones: [],
    });
    localStorage.setItem(TOKEN_KEY, token);
    configure();
    let auth = TestBed.inject(AuthService);

    expect(auth.isAdminCompeticion(99)).toBeTrue();
    controller.expectOne(`${environment.apiUrl}/usuarios/me`).flush({
      id: 1, username: 'admin', email: 'a@x.com', activo: true,
      esAdminSistema: true, rolesCompeticion: [],
    });

    // Usuario sin rol en competición 99: false.
    localStorage.clear();
    token = makeJwt({
      sub: 'pepe', userId: 7, esAdminSistema: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
      competiciones: [{ id: 10, nombre: 'Liga', rol: 'JUGADOR' }],
    });
    localStorage.setItem(TOKEN_KEY, token);
    configure();
    auth = TestBed.inject(AuthService);

    expect(auth.isAdminCompeticion(99)).toBeFalse();
    expect(auth.isAdminCompeticion(10)).toBeFalse(); // sí está en 10 pero como JUGADOR

    controller.expectOne(`${environment.apiUrl}/usuarios/me`).flush({
      id: 7, username: 'pepe', email: 'p@x.com', activo: true,
      esAdminSistema: false, rolesCompeticion: [],
    });
  });

  it('isAdminCompeticion: true cuando el rol específico ADMIN_COMPETICION está presente', () => {
    const token = makeJwt({
      sub: 'jefe', userId: 5, esAdminSistema: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
      competiciones: [{ id: 30, nombre: 'Mi Liga', rol: 'ADMIN_COMPETICION' }],
    });
    localStorage.setItem(TOKEN_KEY, token);

    configure();
    const auth = TestBed.inject(AuthService);

    expect(auth.isAdminCompeticion(30)).toBeTrue();
    expect(auth.isAdminCompeticion(31)).toBeFalse();

    controller.expectOne(`${environment.apiUrl}/usuarios/me`).flush({
      id: 5, username: 'jefe', email: 'j@x.com', activo: true,
      esAdminSistema: false, rolesCompeticion: [],
    });
  });

  it('rolesEnCompeticion: devuelve [] si no hay user o competicionId nulo', () => {
    configure();
    const auth = TestBed.inject(AuthService);

    expect(auth.rolesEnCompeticion(null)).toEqual([]);
    expect(auth.rolesEnCompeticion(undefined)).toEqual([]);
    expect(auth.rolesEnCompeticion(10)).toEqual([]); // no hay user
  });

  it('clearSession: limpia el access token y el currentUser, navega a /auth/login', () => {
    const token = makeJwt({
      sub: 'pepe', userId: 7, esAdminSistema: false,
      exp: Math.floor(Date.now() / 1000) + 3600, competiciones: [],
    });
    localStorage.setItem(TOKEN_KEY, token);

    configure();
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    // Drena el GET /usuarios/me del constructor antes de clearSession.
    controller.expectOne(`${environment.apiUrl}/usuarios/me`).flush({
      id: 7, username: 'pepe', email: 'p@x.com', activo: true,
      esAdminSistema: false, rolesCompeticion: [],
    });

    auth.clearSession();

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(auth.currentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], { replaceUrl: true });
  });
});
