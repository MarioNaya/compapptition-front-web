import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ImageUploadService } from './image-upload.service';
import { environment } from '@env/environment';

const URL = `${environment.apiUrl}/imagenes/upload`;

function file(type: string, sizeBytes: number): File {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type });
  return new File([blob], 'x.jpg', { type });
}

describe('ImageUploadService', () => {
  let svc: ImageUploadService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(ImageUploadService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('upload$: POST /imagenes/upload con FormData (file + folder)', () => {
    svc.upload$(file('image/png', 1024), 'escudos').subscribe();
    const req = http.expectOne(URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
  });

  it('upload$: rechaza tipos no permitidos sin tocar la red', (done) => {
    svc.upload$(file('application/pdf', 1024)).subscribe({
      next: () => done.fail('debería haber rechazado'),
      error: (e) => {
        expect(String(e)).toContain('Formato no admitido');
        done();
      },
    });
    http.expectNone(URL);
  });

  it('upload$: rechaza archivos > 5 MB sin tocar la red', (done) => {
    svc.upload$(file('image/jpeg', 6 * 1024 * 1024)).subscribe({
      next: () => done.fail('debería haber rechazado'),
      error: (e) => {
        expect(String(e)).toContain('máximo de 5 MB');
        done();
      },
    });
    http.expectNone(URL);
  });

  it('upload$: aceptados los formatos jpg/png/webp/gif (cada uno produce POST)', () => {
    let posted = 0;
    for (const t of ['image/jpeg', 'image/png', 'image/webp', 'image/gif']) {
      svc.upload$(file(t, 1024)).subscribe();
      const req = http.expectOne(URL);
      expect(req.request.method).toBe('POST');
      req.flush({ url: 'https://res.cloudinary.com/x.png' });
      posted++;
    }
    expect(posted).toBe(4);
  });
});
