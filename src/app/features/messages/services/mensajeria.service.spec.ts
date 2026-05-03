import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MensajeriaService } from './mensajeria.service';
import { ConversacionSimple } from '@core/models/mensaje';
import { environment } from '@env/environment';

const BASE = `${environment.apiUrl}/conversaciones`;

function conv(id: number, unread: number): ConversacionSimple {
  return {
    id,
    otroUsuarioId: 100 + id,
    otroUsuarioUsername: `u${id}`,
    ultimoMensaje: '...',
    fechaUltimoMensaje: '2026-05-03',
    unreadCount: unread,
  };
}

describe('MensajeriaService', () => {
  let svc: MensajeriaService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    svc = TestBed.inject(MensajeriaService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('listar$: GET base, persiste resultado en signal y unreadTotal lo refleja', () => {
    svc.listar$().subscribe();
    controller.expectOne(BASE).flush([conv(1, 3), conv(2, 0), conv(3, 5)]);

    expect(svc.conversaciones().length).toBe(3);
    expect(svc.unreadTotal()).toBe(8);
  });

  it('unreadTotal: arranca en 0 cuando no hay conversaciones cargadas', () => {
    expect(svc.unreadTotal()).toBe(0);
  });

  it('mensajes$: GET con paginación correcta en query params', () => {
    svc.mensajes$(7, 1, 25).subscribe();
    const req = controller.expectOne((r) =>
      r.url === `${BASE}/7/mensajes` && r.params.get('page') === '1' && r.params.get('size') === '25',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0, totalPages: 0, pageNumber: 1, pageSize: 25, first: true, last: true });
  });

  it('marcarLeido$: PATCH y reset local del unreadCount de la conversación afectada', () => {
    svc.listar$().subscribe();
    controller.expectOne(BASE).flush([conv(1, 4), conv(2, 7)]);
    expect(svc.unreadTotal()).toBe(11);

    svc.marcarLeido$(1).subscribe();
    const req = controller.expectOne(`${BASE}/1/leer`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);

    // Solo la conv 1 ha bajado a 0; la conv 2 mantiene su unreadCount.
    expect(svc.unreadTotal()).toBe(7);
  });

  it('reset: vacía conversaciones y unreadTotal vuelve a 0', () => {
    svc.listar$().subscribe();
    controller.expectOne(BASE).flush([conv(1, 2)]);
    expect(svc.unreadTotal()).toBe(2);

    svc.reset();
    expect(svc.conversaciones()).toEqual([]);
    expect(svc.unreadTotal()).toBe(0);
  });
});
