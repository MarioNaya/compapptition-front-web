import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastHostComponent } from './toast-host.component';
import { ToastService } from '@shared/services/toast.service';

describe('ToastHostComponent', () => {
  let fixture: ComponentFixture<ToastHostComponent>;
  let svc: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ToastHostComponent],
      providers: [ToastService],
    });
    svc = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(ToastHostComponent);
  });

  it('expone los toasts del servicio (signal compartido)', () => {
    svc.success('Hola', 0);
    fixture.detectChanges();
    expect(fixture.componentInstance.toasts().length).toBe(1);
    expect(fixture.componentInstance.toasts()[0].message).toBe('Hola');
  });

  it('dismiss llama al servicio y elimina el toast', () => {
    svc.error('Boom', 0);
    fixture.detectChanges();
    const toast = fixture.componentInstance.toasts()[0];

    fixture.componentInstance.dismiss(toast.id);
    fixture.detectChanges();

    expect(fixture.componentInstance.toasts().length).toBe(0);
  });
});
