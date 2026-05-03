import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '@core/services/auth.service';

describe('authGuard', () => {
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

  function runGuard(stateUrl = '/app/dashboard') {
    return TestBed.runInInjectionContext(() =>
      authGuard(
        {} as never,
        { url: stateUrl, root: {} as never } as never,
      ),
    );
  }

  it('permite el acceso cuando hay sesión activa', () => {
    authMock.isAuthenticated.and.returnValue(true);

    expect(runGuard()).toBeTrue();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('bloquea y redirige a /auth/login cuando no hay sesión', () => {
    authMock.isAuthenticated.and.returnValue(false);

    expect(runGuard('/app/competitions')).toBeFalse();
    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: '/app/competitions' } },
    );
  });

  it('preserva la URL solicitada en queryParams.returnUrl para redirección post-login', () => {
    authMock.isAuthenticated.and.returnValue(false);

    runGuard('/app/teams/42');

    const args = routerMock.navigate.calls.mostRecent().args;
    expect(args[0]).toEqual(['/auth/login']);
    expect(args[1]).toEqual({ queryParams: { returnUrl: '/app/teams/42' } });
  });
});
