import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EmptyStateComponent] });
    fixture = TestBed.createComponent(EmptyStateComponent);
    fixture.componentRef.setInput('title', 'Sin datos');
  });

  it('renderiza title obligatorio', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin datos');
  });

  it('renderiza subtitle cuando se pasa', () => {
    fixture.componentRef.setInput('subtitle', 'Detalle adicional');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Detalle adicional');
  });

  it('subtitle por defecto null: no rompe el render', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.subtitle()).toBeNull();
  });

  it('icon por defecto = "inbox" (puede sobrescribirse)', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.icon()).toBe('inbox');
    fixture.componentRef.setInput('icon', 'bell');
    fixture.detectChanges();
    expect(fixture.componentInstance.icon()).toBe('bell');
  });
});
