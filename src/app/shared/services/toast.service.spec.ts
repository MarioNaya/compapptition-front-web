import { TestBed } from '@angular/core/testing';
import { fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let svc: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ToastService] });
    svc = TestBed.inject(ToastService);
  });

  it('arranca con la cola vacía', () => {
    expect(svc.toasts()).toEqual([]);
  });

  it('success/error/info: encolan en orden con la variante correcta', () => {
    svc.success('Guardado');
    svc.error('Falló');
    svc.info('Aviso');

    const list = svc.toasts();
    expect(list.length).toBe(3);
    expect(list[0].variant).toBe('success');
    expect(list[1].variant).toBe('error');
    expect(list[2].variant).toBe('info');
  });

  it('asigna ids únicos crecientes', () => {
    svc.success('a');
    svc.success('b');
    const [a, b] = svc.toasts();
    expect(b.id).toBeGreaterThan(a.id);
  });

  it('dismiss elimina solo el toast con el id pedido', () => {
    svc.success('a', 0); // duración 0 => no auto-dismiss
    svc.error('b', 0);
    const ids = svc.toasts().map((t) => t.id);

    svc.dismiss(ids[0]);
    const remaining = svc.toasts();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(ids[1]);
  });

  it('auto-dismiss tras durationMs (timer real con fakeAsync)', fakeAsync(() => {
    svc.success('breve', 1000);
    expect(svc.toasts().length).toBe(1);

    tick(999);
    expect(svc.toasts().length).toBe(1);

    tick(1);
    expect(svc.toasts().length).toBe(0);
  }));

  it('durationMs=0 mantiene el toast hasta que se cierre manualmente', fakeAsync(() => {
    svc.error('persistente', 0);
    tick(60_000);
    expect(svc.toasts().length).toBe(1);
  }));
});
