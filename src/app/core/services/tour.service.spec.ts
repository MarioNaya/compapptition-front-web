import { TestBed } from '@angular/core/testing';
import { TourService, TourStep } from './tour.service';
import { findTourForRoute } from './tour.registry';

const STEPS: readonly TourStep[] = [
  { selector: '[data-tour="a"]', title: 'A', description: 'paso a' },
  { selector: '[data-tour="b"]', title: 'B', description: 'paso b' },
  { selector: '[data-tour="c"]', title: 'C', description: 'paso c' },
];

describe('TourService', () => {
  let svc: TourService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TourService] });
    svc = TestBed.inject(TourService);
  });

  it('arranca parado, sin pasos', () => {
    expect(svc.running()).toBeFalse();
    expect(svc.total()).toBe(0);
    expect(svc.currentStep()).toBeNull();
  });

  it('start con lista vacía no inicia el tour', () => {
    svc.start([]);
    expect(svc.running()).toBeFalse();
  });

  it('start con pasos: arranca corriendo en el primero', () => {
    svc.start(STEPS);
    expect(svc.running()).toBeTrue();
    expect(svc.index()).toBe(0);
    expect(svc.currentStep()?.title).toBe('A');
    expect(svc.isFirst()).toBeTrue();
    expect(svc.isLast()).toBeFalse();
  });

  it('next avanza paso a paso y cierra el tour al pasar del último', () => {
    svc.start(STEPS);
    svc.next();
    expect(svc.index()).toBe(1);
    svc.next();
    expect(svc.isLast()).toBeTrue();

    svc.next(); // pasa del último → cancel automático
    expect(svc.running()).toBeFalse();
    expect(svc.index()).toBe(0);
    expect(svc.total()).toBe(0);
  });

  it('prev no retrocede más allá del paso 0', () => {
    svc.start(STEPS);
    svc.prev();
    expect(svc.index()).toBe(0);
    svc.next();
    svc.prev();
    expect(svc.index()).toBe(0);
  });

  it('cancel resetea index y pasos', () => {
    svc.start(STEPS);
    svc.next();
    svc.cancel();
    expect(svc.running()).toBeFalse();
    expect(svc.index()).toBe(0);
    expect(svc.currentStep()).toBeNull();
  });
});

describe('findTourForRoute', () => {
  it('localiza el tour del dashboard para /app/dashboard (con o sin trailing slash)', () => {
    expect(findTourForRoute('/app/dashboard')?.title).toBe('Dashboard');
    expect(findTourForRoute('/app/dashboard/')?.title).toBe('Dashboard');
  });

  it('localiza el tour de detalle de competición para /app/competitions/123', () => {
    expect(findTourForRoute('/app/competitions/123')?.title).toBe('Detalle de competición');
  });

  it('ignora query params y fragmentos al hacer el match', () => {
    expect(findTourForRoute('/app/dashboard?foo=bar#baz')?.title).toBe('Dashboard');
  });

  it('devuelve null para rutas sin tour registrado', () => {
    expect(findTourForRoute('/app/teams')).toBeNull();
    expect(findTourForRoute('/app/profile')).toBeNull();
  });
});
