import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsuarioService } from './usuario.service';
import { environment } from '@env/environment';

const BASE = `${environment.apiUrl}/usuarios`;

describe('UsuarioService', () => {
  let svc: UsuarioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    svc = TestBed.inject(UsuarioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('findById$: GET /usuarios/{id}', () => {
    svc.findById$(7).subscribe();
    expect(http.expectOne(`${BASE}/7`).request.method).toBe('GET');
  });

  it('buscarPorUsername$: GET /usuarios/buscar con query username', () => {
    svc.buscarPorUsername$('alberto').subscribe();
    const req = http.expectOne((r) => r.url === `${BASE}/buscar` && r.params.get('username') === 'alberto');
    expect(req.request.method).toBe('GET');
  });

  it('update$: PUT /usuarios/{id} con el body recibido', () => {
    svc.update$(7, { nombre: 'X' }).subscribe();
    const req = http.expectOne(`${BASE}/7`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ nombre: 'X' });
  });

  it('cambiarPassword$: POST /usuarios/{id}/cambiar-password', () => {
    svc.cambiarPassword$(7, { passwordActual: 'a', passwordNuevo: 'b' }).subscribe();
    const req = http.expectOne(`${BASE}/7/cambiar-password`);
    expect(req.request.method).toBe('POST');
  });

  it('desactivar$: DELETE /usuarios/{id}', () => {
    svc.desactivar$(7).subscribe();
    expect(http.expectOne(`${BASE}/7`).request.method).toBe('DELETE');
  });
});
