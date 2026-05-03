import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotchCardComponent } from './notch-card.component';

describe('NotchCardComponent', () => {
  let fixture: ComponentFixture<NotchCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [NotchCardComponent] });
    fixture = TestBed.createComponent(NotchCardComponent);
  });

  it('renderiza el tag obligatorio en el HTML', () => {
    fixture.componentRef.setInput('tag', 'NOVEDAD');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('NOVEDAD');
  });

  it('pulse=true por defecto, sobrescribible', () => {
    fixture.componentRef.setInput('tag', 'X');
    fixture.detectChanges();
    expect(fixture.componentInstance.pulse()).toBeTrue();

    fixture.componentRef.setInput('pulse', false);
    fixture.detectChanges();
    expect(fixture.componentInstance.pulse()).toBeFalse();
  });
});
