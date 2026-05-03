import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { Notificacion, TipoNotificacion } from '@core/models/notificacion';
import { PageResponse } from '@core/models/comun/page.model';
import { environment } from '@env/environment';

const BASE = `${environment.apiUrl}/notificaciones`;

function notif(id: number, leida = false): Notificacion {
  return {
    id,
    tipo: TipoNotificacion.MENSAJE_RECIBIDO,
    payload: { conversacionId: id },
    leida,
    fechaCreacion: '2026-05-03T00:00:00Z',
  };
}

describe('NotificationService', () => {
  let svc: NotificationService;
  let controller: HttpTestingController;
  let authMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authMock = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated', 'getToken',
    ]);
    authMock.isAuthenticated.and.returnValue(true);
    authMock.getToken.and.returnValue('tok');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
      ],
    });
    svc = TestBed.inject(NotificationService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('arranca con lista vacía y unreadCount=0', () => {
    expect(svc.items()).toEqual([]);
    expect(svc.unreadCount()).toBe(0);
  });

  it('listar$ rellena la lista y unreadCount cuenta las no leídas', () => {
    const page: PageResponse<Notificacion> = {
      content: [notif(1, false), notif(2, true), notif(3, false)],
      totalElements: 3, totalPages: 1, pageNumber: 0, pageSize: 10, first: true, last: true,
    };

    svc.listar$().subscribe();
    const req = controller.expectOne((r) => r.url === BASE);
    req.flush(page);

    expect(svc.items().length).toBe(3);
    expect(svc.unreadCount()).toBe(2);
  });

  it('listar$ con leida=true: pasa el query param', () => {
    svc.listar$(0, 10, true).subscribe();
    const req = controller.expectOne((r) => r.url === BASE && r.params.get('leida') === 'true');
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: 10, first: true, last: true });
  });

  it('marcarLeida$: PATCH y pasa la notificación local a leida=true', () => {
    svc.listar$().subscribe();
    controller.expectOne((r) => r.url === BASE).flush({
      content: [notif(7, false)], totalElements: 1, totalPages: 1, pageNumber: 0, pageSize: 10, first: true, last: true,
    });

    svc.marcarLeida$(7).subscribe();
    controller.expectOne(`${BASE}/7/leer`).flush(null);

    expect(svc.items()[0].leida).toBeTrue();
    expect(svc.unreadCount()).toBe(0);
  });

  it('marcarTodasLeidas$: PATCH y todas pasan a leídas localmente', () => {
    svc.listar$().subscribe();
    controller.expectOne((r) => r.url === BASE).flush({
      content: [notif(1), notif(2), notif(3)], totalElements: 3, totalPages: 1, pageNumber: 0, pageSize: 10, first: true, last: true,
    });
    expect(svc.unreadCount()).toBe(3);

    svc.marcarTodasLeidas$().subscribe();
    controller.expectOne(`${BASE}/leer-todas`).flush(null);

    expect(svc.unreadCount()).toBe(0);
  });

  it('eliminar$: DELETE y la notificación desaparece de la lista', () => {
    svc.listar$().subscribe();
    controller.expectOne((r) => r.url === BASE).flush({
      content: [notif(1), notif(2)], totalElements: 2, totalPages: 1, pageNumber: 0, pageSize: 10, first: true, last: true,
    });

    svc.eliminar$(1).subscribe();
    controller.expectOne(`${BASE}/1`).flush(null);

    expect(svc.items().length).toBe(1);
    expect(svc.items()[0].id).toBe(2);
  });

  it('eliminarLeidas$: DELETE /leidas y filtra las leídas localmente', () => {
    svc.listar$().subscribe();
    controller.expectOne((r) => r.url === BASE).flush({
      content: [notif(1, false), notif(2, true), notif(3, true)],
      totalElements: 3, totalPages: 1, pageNumber: 0, pageSize: 10, first: true, last: true,
    });

    svc.eliminarLeidas$().subscribe();
    controller.expectOne(`${BASE}/leidas`).flush({ eliminadas: 2 });

    expect(svc.items().length).toBe(1);
    expect(svc.items()[0].id).toBe(1);
  });

  it('reset: limpia items y resetea contadores SSE', () => {
    svc.listar$().subscribe();
    controller.expectOne((r) => r.url === BASE).flush({
      content: [notif(1)], totalElements: 1, totalPages: 1, pageNumber: 0, pageSize: 10, first: true, last: true,
    });
    expect(svc.items().length).toBe(1);

    svc.reset();
    expect(svc.items()).toEqual([]);
  });
});
