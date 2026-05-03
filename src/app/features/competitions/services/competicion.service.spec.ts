import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CompeticionService } from './competicion.service';
import { EstadoCompeticion } from '@core/models/competicion/competicion.model';
import { environment } from '@env/environment';

const BASE = `${environment.apiUrl}/competiciones`;

describe('CompeticionService', () => {
  let svc: CompeticionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    svc = TestBed.inject(CompeticionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('findAllSimple$ sin search → /publicas/simple', () => {
    svc.findAllSimple$({}).subscribe();
    const req = http.expectOne((r) => r.url === `${BASE}/publicas/simple`);
    expect(req.request.method).toBe('GET');
  });

  it('findAllSimple$ con search → /publicas/buscar y query search', () => {
    svc.findAllSimple$({ search: 'liga' }).subscribe();
    const req = http.expectOne((r) =>
      r.url === `${BASE}/publicas/buscar` && r.params.get('search') === 'liga',
    );
    expect(req.request.method).toBe('GET');
  });

  it('findByIdDetalle$ y findByIdSimple$ usan paths /detalle y /simple', () => {
    svc.findByIdDetalle$(7).subscribe();
    expect(http.expectOne(`${BASE}/7/detalle`).request.method).toBe('GET');

    svc.findByIdSimple$(7).subscribe();
    expect(http.expectOne(`${BASE}/7/simple`).request.method).toBe('GET');
  });

  it('mis-competiciones: creador, participante, por-rol', () => {
    svc.misCreadas$().subscribe();
    expect(http.expectOne(`${BASE}/mis-competiciones/creador`).request.method).toBe('GET');

    svc.misParticipadas$().subscribe();
    expect(http.expectOne(`${BASE}/mis-competiciones/participante`).request.method).toBe('GET');

    svc.misCompeticionesPorRol$().subscribe();
    expect(http.expectOne(`${BASE}/mis-competiciones/por-rol`).request.method).toBe('GET');
  });

  it('create$ POST base, update$ PUT /{id}, delete$ DELETE /{id}', () => {
    svc.create$({} as never).subscribe();
    expect(http.expectOne(BASE).request.method).toBe('POST');

    svc.update$(5, {} as never).subscribe();
    expect(http.expectOne(`${BASE}/5`).request.method).toBe('PUT');

    svc.delete$(5).subscribe();
    expect(http.expectOne(`${BASE}/5`).request.method).toBe('DELETE');
  });

  it('patchEstado$: PATCH /{id}/estado con query estado', () => {
    svc.patchEstado$(9, EstadoCompeticion.ACTIVA).subscribe();
    const req = http.expectOne((r) =>
      r.url === `${BASE}/9/estado` && r.params.get('estado') === 'ACTIVA',
    );
    expect(req.request.method).toBe('PATCH');
  });

  it('loadList rellena signals con la respuesta paginada', () => {
    svc.loadList({});
    const req = http.expectOne((r) => r.url === `${BASE}/publicas/simple`);
    req.flush({
      content: [{ id: 1 } as never], totalElements: 1, totalPages: 1,
      pageNumber: 0, pageSize: 10, first: true, last: true,
    });
    expect(svc.list().length).toBe(1);
    expect(svc.totalElements()).toBe(1);
    expect(svc.loading()).toBeFalse();
  });

  it('loadList propaga error al signal error', () => {
    svc.loadList({});
    const req = http.expectOne((r) => r.url === `${BASE}/publicas/simple`);
    req.flush(null, { status: 500, statusText: 'Server' });
    expect(svc.error()).toBeTruthy();
    expect(svc.loading()).toBeFalse();
  });

  it('activeCount: cuenta solo ACTIVA en el signal list', () => {
    svc.loadList({});
    http.expectOne((r) => r.url === `${BASE}/publicas/simple`).flush({
      content: [
        { id: 1, estado: EstadoCompeticion.ACTIVA },
        { id: 2, estado: EstadoCompeticion.BORRADOR },
        { id: 3, estado: EstadoCompeticion.ACTIVA },
      ] as never,
      totalElements: 3, totalPages: 1, pageNumber: 0, pageSize: 10, first: true, last: true,
    });
    expect(svc.activeCount()).toBe(2);
  });
});
