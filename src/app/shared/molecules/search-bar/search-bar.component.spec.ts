import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchBarComponent } from './search-bar.component';

describe('SearchBarComponent', () => {
  let fixture: ComponentFixture<SearchBarComponent>;
  let cmp: SearchBarComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SearchBarComponent] });
    fixture = TestBed.createComponent(SearchBarComponent);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emite valueChange cuando el método onInput se invoca con el texto', (done) => {
    cmp.valueChange.subscribe((v) => {
      expect(v).toBe('hola');
      done();
    });
    cmp.onInput('hola');
  });

  it('emite filterClicked cuando se invoca clickFilter', (done) => {
    cmp.filterClicked.subscribe(() => done());
    cmp.clickFilter();
  });

  it('value() input expone el texto recibido al componente', () => {
    fixture.componentRef.setInput('value', 'precargado');
    fixture.detectChanges();
    expect(cmp.value()).toBe('precargado');
  });
});
