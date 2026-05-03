import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@shared/services/toast.service';
import { Usuario } from '@core/models/usuario';

describe('adminGuard', () => {
  let routerMock: jasmine.SpyObj<Router>;
  let toastMock: jasmine.SpyObj<ToastService>;
  let currentUserSig: { (): Usuario | null };

  function fakeAuth(user: Usuario | null): AuthService {
    return {
      currentUser: () => user,
    } as unknown as AuthService;
  }

  beforeEach(() => {
    routerMock = jasmine.createSpyObj<Router>('Router', ['navigate']);
    toastMock = jasmine.createSpyObj<ToastService>('ToastService', ['error', 'info', 'success']);
  });

  function configure(user: Usuario | null) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: fakeAuth(user) },
        { provide: Router, useValue: routerMock },
        { provide: ToastService, useValue: toastMock },
      ],
    });
  }

  function runGuard() {
    return TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/app/admin', root: {} as never } as never),
    );
  }

  it('redirige a /auth/login si no hay usuario autenticado', () => {
    configure(null);

    expect(runGuard()).toBeFalse();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it('bloquea con toast y redirige al dashboard si el usuario no es admin de sistema', () => {
    configure({
      id: 7,
      username: 'pepe',
      email: 'pepe@test.com',
      activo: true,
      esAdminSistema: false,
      rolesCompeticion: [],
    });

    expect(runGuard()).toBeFalse();
    expect(toastMock.error).toHaveBeenCalledWith(
      'No tienes permisos de administrador de sistema',
    );
    expect(routerMock.navigate).toHaveBeenCalledWith(['/app/dashboard']);
  });

  it('permite el acceso a un admin de sistema autenticado', () => {
    configure({
      id: 1,
      username: 'admin',
      email: 'admin@test.com',
      activo: true,
      esAdminSistema: true,
      rolesCompeticion: [],
    });

    expect(runGuard()).toBeTrue();
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(toastMock.error).not.toHaveBeenCalled();
  });
});
