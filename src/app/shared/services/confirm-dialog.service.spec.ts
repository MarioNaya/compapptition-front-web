import { TestBed } from '@angular/core/testing';
import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogService', () => {
  let svc: ConfirmDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ConfirmDialogService] });
    svc = TestBed.inject(ConfirmDialogService);
  });

  it('arranca sin diálogo activo', () => {
    expect(svc.active()).toBeNull();
  });

  it('ask deja el diálogo activo con los datos pasados', () => {
    svc.ask({ title: '¿Eliminar?', message: 'No reversible', destructive: true });
    const a = svc.active();
    expect(a?.title).toBe('¿Eliminar?');
    expect(a?.message).toBe('No reversible');
    expect(a?.destructive).toBeTrue();
  });

  it('respond(true) resuelve la promesa con true y limpia el diálogo activo', async () => {
    const p = svc.ask({ title: 'OK?' });
    svc.respond(true);
    await expectAsync(p).toBeResolvedTo(true);
    expect(svc.active()).toBeNull();
  });

  it('respond(false) resuelve con false y limpia el diálogo activo', async () => {
    const p = svc.ask({ title: 'Cancel?' });
    svc.respond(false);
    await expectAsync(p).toBeResolvedTo(false);
    expect(svc.active()).toBeNull();
  });

  it('respond cuando no hay diálogo activo no rompe', () => {
    expect(() => svc.respond(true)).not.toThrow();
  });
});
