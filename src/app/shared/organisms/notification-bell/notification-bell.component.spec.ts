import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NotificationBellComponent } from './notification-bell.component';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

describe('NotificationBellComponent', () => {
  let authMock: jasmine.SpyObj<AuthService>;
  let notifMock: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    authMock = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated']);
    authMock.isAuthenticated.and.returnValue(false); // arranca desconectado para evitar SSE en test

    notifMock = jasmine.createSpyObj<NotificationService>(
      'NotificationService',
      ['listar$', 'connect', 'disconnect', 'marcarLeida$', 'marcarTodasLeidas$', 'eliminar$'],
      { unreadCount: () => 0, items: () => [] } as never,
    );
    notifMock.listar$.and.returnValue({ subscribe: () => ({}) } as never);
    notifMock.marcarLeida$.and.returnValue({ subscribe: () => ({}) } as never);
    notifMock.marcarTodasLeidas$.and.returnValue({ subscribe: () => ({}) } as never);
    notifMock.eliminar$.and.returnValue({ subscribe: () => ({}) } as never);

    TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: NotificationService, useValue: notifMock },
      ],
    });
  });

  it('toggle abre y cierra el dropdown; al abrir vuelve a pedir la lista', () => {
    const fixture = TestBed.createComponent(NotificationBellComponent);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    expect(cmp.open()).toBeFalse();
    cmp.toggle();
    expect(cmp.open()).toBeTrue();
    expect(notifMock.listar$).toHaveBeenCalledWith(0, 10);

    cmp.toggle();
    expect(cmp.open()).toBeFalse();
  });

  it('markAll dispara marcarTodasLeidas$ del servicio', () => {
    const fixture = TestBed.createComponent(NotificationBellComponent);
    fixture.detectChanges();
    fixture.componentInstance.markAll();
    expect(notifMock.marcarTodasLeidas$).toHaveBeenCalled();
  });

  it('close pone open en false', () => {
    const fixture = TestBed.createComponent(NotificationBellComponent);
    fixture.detectChanges();
    fixture.componentInstance.toggle();
    fixture.componentInstance.close();
    expect(fixture.componentInstance.open()).toBeFalse();
  });
});
