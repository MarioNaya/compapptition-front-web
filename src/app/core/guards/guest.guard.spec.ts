import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { guestGuard } from './guest.guard';
import { AuthService } from '@core/services/auth.service';

describe('guestGuard', () => {
  let authMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authMock = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated']);
    routerMock = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  function runGuard() {
    return TestBed.runInInjectionContext(() =>
      guestGuard({} as never, { url: '/auth/login', root: {} as never } as never),
    );
  }

  it('permite el acceso a invitados (sin sesión)', () => {
    authMock.isAuthenticated.and.returnValue(false);

    expect(runGuard()).toBeTrue();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('redirige al dashboard cuando ya hay sesión activa (no exponer login a usuarios logueados)', () => {
    authMock.isAuthenticated.and.returnValue(true);

    expect(runGuard()).toBeFalse();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/app/dashboard']);
  });

  it('no añade queryParams al redirigir (no es un caso post-login)', () => {
    authMock.isAuthenticated.and.returnValue(true);

    runGuard();

    expect(routerMock.navigate.calls.mostRecent().args[1]).toBeUndefined();
  });
});
