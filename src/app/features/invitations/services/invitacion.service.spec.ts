import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InvitacionService } from './invitacion.service';
import { EstadoInvitacion, Invitacion } from '@core/models/invitacion/invitacion.model';
import { RolCompeticion } from '@core/models/rol';
import { environment } from '@env/environment';

const BASE = `${environment.apiUrl}/invitaciones`;

function inv(id: number, estado: EstadoInvitacion): Invitacion {
  return {
    id,
    estado,
    rolOfrecido: RolCompeticion.JUGADOR,
    emisorId: 1,
    emisorUsername: 'admin',
    fechaCreacion: '2026-05-03',
  };
}

describe('InvitacionService', () => {
  let svc: InvitacionService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    svc = TestBed.inject(InvitacionService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('pendingCount: cuenta solo las pendientes', () => {
    svc.findPendientes$().subscribe();
    controller.expectOne(`${BASE}/pendientes`).flush([
      inv(1, EstadoInvitacion.PENDIENTE),
      inv(2, EstadoInvitacion.PENDIENTE),
      inv(3, EstadoInvitacion.ACEPTADA),
      inv(4, EstadoInvitacion.RECHAZADA),
    ]);
    svc.loadPendientes();
    controller.expectOne(`${BASE}/pendientes`).flush([
      inv(1, EstadoInvitacion.PENDIENTE),
      inv(2, EstadoInvitacion.PENDIENTE),
      inv(3, EstadoInvitacion.ACEPTADA),
      inv(4, EstadoInvitacion.RECHAZADA),
    ]);
    expect(svc.pendingCount()).toBe(2);
  });

  it('aceptar$ usa PUT /{token}/aceptar y rechazar$ usa PUT /{token}/rechazar', () => {
    svc.aceptar$('TKN-1').subscribe();
    const a = controller.expectOne(`${BASE}/TKN-1/aceptar`);
    expect(a.request.method).toBe('PUT');
    a.flush(inv(1, EstadoInvitacion.ACEPTADA));

    svc.rechazar$('TKN-2').subscribe();
    const r = controller.expectOne(`${BASE}/TKN-2/rechazar`);
    expect(r.request.method).toBe('PUT');
    r.flush(inv(2, EstadoInvitacion.RECHAZADA));
  });

  it('reset vacía recibidas y enviadas', () => {
    svc.loadPendientes();
    controller.expectOne(`${BASE}/pendientes`).flush([inv(1, EstadoInvitacion.PENDIENTE)]);
    svc.loadEnviadas();
    controller.expectOne(`${BASE}/enviadas`).flush([inv(2, EstadoInvitacion.PENDIENTE)]);

    expect(svc.recibidas().length).toBe(1);
    expect(svc.enviadas().length).toBe(1);

    svc.reset();
    expect(svc.recibidas()).toEqual([]);
    expect(svc.enviadas()).toEqual([]);
    expect(svc.pendingCount()).toBe(0);
  });

  it('findByCompeticion$ usa la URL con el id correcto', () => {
    svc.findByCompeticion$(42).subscribe();
    const req = controller.expectOne(`${BASE}/competicion/42`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
