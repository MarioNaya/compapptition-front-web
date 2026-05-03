import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ImageUploadComponent } from './image-upload.component';
import { ImageUploadService } from '@core/services/image-upload.service';
import { ToastService } from '@shared/services/toast.service';

describe('ImageUploadComponent', () => {
  let svcMock: jasmine.SpyObj<ImageUploadService>;
  let toastMock: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    svcMock = jasmine.createSpyObj<ImageUploadService>('ImageUploadService', ['upload$']);
    toastMock = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error', 'info']);

    TestBed.configureTestingModule({
      imports: [ImageUploadComponent],
      providers: [
        { provide: ImageUploadService, useValue: svcMock },
        { provide: ToastService, useValue: toastMock },
      ],
    });
  });

  function buildEvent(file: File | null): Event {
    const input = document.createElement('input');
    input.type = 'file';
    if (file) {
      Object.defineProperty(input, 'files', { value: [file], writable: false });
    } else {
      Object.defineProperty(input, 'files', { value: [], writable: false });
    }
    return { target: input } as unknown as Event;
  }

  it('upload exitoso: emite urlChanged y muestra toast success', () => {
    svcMock.upload$.and.returnValue(of({ url: 'https://res.cloudinary.com/x.png' }));

    const fixture = TestBed.createComponent(ImageUploadComponent);
    fixture.detectChanges();

    const emitted: string[] = [];
    fixture.componentInstance.urlChanged.subscribe((url) => emitted.push(url));

    const file = new File([new Uint8Array(10)], 'x.png', { type: 'image/png' });
    fixture.componentInstance.onFileSelected(buildEvent(file));

    expect(emitted).toEqual(['https://res.cloudinary.com/x.png']);
    expect(toastMock.success).toHaveBeenCalled();
    expect(fixture.componentInstance.uploading()).toBeFalse();
  });

  it('upload fallido: muestra toast error y deja uploading en false', () => {
    svcMock.upload$.and.returnValue(throwError(() => ({ message: 'fallo' })));

    const fixture = TestBed.createComponent(ImageUploadComponent);
    fixture.detectChanges();
    const file = new File([new Uint8Array(10)], 'x.png', { type: 'image/png' });
    fixture.componentInstance.onFileSelected(buildEvent(file));

    expect(toastMock.error).toHaveBeenCalled();
    expect(fixture.componentInstance.uploading()).toBeFalse();
  });

  it('sin archivo seleccionado: no llama al servicio', () => {
    const fixture = TestBed.createComponent(ImageUploadComponent);
    fixture.detectChanges();
    fixture.componentInstance.onFileSelected(buildEvent(null));
    expect(svcMock.upload$).not.toHaveBeenCalled();
  });

  it('clear emite cleared', (done) => {
    const fixture = TestBed.createComponent(ImageUploadComponent);
    fixture.detectChanges();
    fixture.componentInstance.cleared.subscribe(() => done());
    fixture.componentInstance.clear();
  });
});
