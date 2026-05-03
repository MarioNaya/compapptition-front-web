import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeamPairComponent } from './team-pair.component';

describe('TeamPairComponent', () => {
  let fixture: ComponentFixture<TeamPairComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TeamPairComponent] });
    fixture = TestBed.createComponent(TeamPairComponent);
    fixture.componentRef.setInput('home', 'Athletic');
    fixture.componentRef.setInput('away', 'Real');
  });

  it('renderiza nombres de ambos equipos', () => {
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Athletic');
    expect(text).toContain('Real');
  });

  it('size por defecto = "sm"', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.size()).toBe('sm');
  });

  it('crests por defecto null (sin imágenes)', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.homeCrest()).toBeNull();
    expect(fixture.componentInstance.awayCrest()).toBeNull();
  });
});
