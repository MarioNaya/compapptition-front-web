import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let svc: ConfirmDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [ConfirmDialogService],
    });
    svc = TestBed.inject(ConfirmDialogService);
    fixture = TestBed.createComponent(ConfirmDialogComponent);
  });

  it('active() refleja la petición del servicio', async () => {
    void svc.ask({ title: '¿Borrar?' });
    fixture.detectChanges();
    expect(fixture.componentInstance.active()?.title).toBe('¿Borrar?');
  });

  it('confirm() resuelve la promesa del servicio con true', async () => {
    const p = svc.ask({ title: 'OK?' });
    fixture.componentInstance.confirm();
    await expectAsync(p).toBeResolvedTo(true);
  });

  it('cancel() resuelve la promesa del servicio con false', async () => {
    const p = svc.ask({ title: 'Cancel?' });
    fixture.componentInstance.cancel();
    await expectAsync(p).toBeResolvedTo(false);
  });
});
