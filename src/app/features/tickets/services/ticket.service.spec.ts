import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TicketService } from './ticket.service';
import { environment } from '@env/environment';

const BASE = `${environment.apiUrl}/tickets`;

describe('TicketService', () => {
  let svc: TicketService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(TicketService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crear$: POST /tickets', () => {
    svc.crear$({ asunto: 'X', descripcion: 'Y' }).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ asunto: 'X', descripcion: 'Y' });
  });

  it('misTickets$: GET /tickets/mis con paginación', () => {
    svc.misTickets$(2, 50).subscribe();
    const req = http.expectOne((r) =>
      r.url === `${BASE}/mis` && r.params.get('page') === '2' && r.params.get('size') === '50',
    );
    expect(req.request.method).toBe('GET');
  });

  it('listarTodos$: GET /tickets sin estado o con estado', () => {
    svc.listarTodos$(0, 20).subscribe();
    const r1 = http.expectOne((r) => r.url === BASE && r.params.get('estado') === null);
    expect(r1.request.method).toBe('GET');

    svc.listarTodos$(0, 20, 'ABIERTO').subscribe();
    const r2 = http.expectOne((r) => r.url === BASE && r.params.get('estado') === 'ABIERTO');
    expect(r2.request.method).toBe('GET');
  });

  it('detalle$ GET /tickets/{id}, contarPendientes$ GET /pendientes/count', () => {
    svc.detalle$(7).subscribe();
    expect(http.expectOne(`${BASE}/7`).request.method).toBe('GET');

    svc.contarPendientes$().subscribe();
    expect(http.expectOne(`${BASE}/pendientes/count`).request.method).toBe('GET');
  });

  it('actualizarEstado$ PATCH /{id}/estado, eliminar$ DELETE /{id}', () => {
    svc.actualizarEstado$(7, { estado: 'RESUELTO' }).subscribe();
    expect(http.expectOne(`${BASE}/7/estado`).request.method).toBe('PATCH');

    svc.eliminar$(7).subscribe();
    expect(http.expectOne(`${BASE}/7`).request.method).toBe('DELETE');
  });
});
