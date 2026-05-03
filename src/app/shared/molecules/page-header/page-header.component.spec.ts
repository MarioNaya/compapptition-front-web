import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentRef.setInput('title', 'Título');
  });

  it('back=null: showBack() devuelve false (sin botón)', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.showBack()).toBeFalse();
  });

  it('back=true: showBack() true y backAsLink() null (usa Location.back)', () => {
    fixture.componentRef.setInput('back', true);
    fixture.detectChanges();
    expect(fixture.componentInstance.showBack()).toBeTrue();
    expect(fixture.componentInstance.backAsLink()).toBeNull();
  });

  it('back=array: backAsLink() devuelve el array intacto (routerLink)', () => {
    fixture.componentRef.setInput('back', ['/app/competitions', 7]);
    fixture.detectChanges();
    expect(fixture.componentInstance.backAsLink()).toEqual(['/app/competitions', 7]);
  });

  it('onBackClick con back=true: preventDefault y delega en Location.back', () => {
    const location = TestBed.inject(Location);
    spyOn(location, 'back');

    fixture.componentRef.setInput('back', true);
    fixture.detectChanges();

    const ev = new MouseEvent('click');
    spyOn(ev, 'preventDefault');

    fixture.componentInstance.onBackClick(ev);

    expect(ev.preventDefault).toHaveBeenCalled();
    expect(location.back).toHaveBeenCalled();
  });
});
