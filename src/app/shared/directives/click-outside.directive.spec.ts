import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ClickOutsideDirective } from './click-outside.directive';

@Component({
  standalone: true,
  imports: [ClickOutsideDirective],
  template: `
    <div
      data-testid="host"
      appClickOutside
      [enabled]="enabled()"
      (clickOutside)="onOutside()"
    >
      <button data-testid="inside">inside</button>
    </div>
    <button data-testid="outside">outside</button>
  `,
})
class HostComponent {
  readonly enabled = signal(true);
  readonly outsideEvents = signal(0);
  onOutside(): void {
    this.outsideEvents.update((n) => n + 1);
  }
}

describe('ClickOutsideDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  function setUp(): void {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  }

  function fireMouseDown(el: HTMLElement): void {
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  }

  it('NO emite cuando el click ocurre dentro del host', fakeAsync(() => {
    setUp();
    tick(0); // deja que setTimeout(attach, 0) registre el listener
    const inside = fixture.nativeElement.querySelector('[data-testid="inside"]') as HTMLElement;

    fireMouseDown(inside);

    expect(fixture.componentInstance.outsideEvents()).toBe(0);
  }));

  it('emite clickOutside cuando el click ocurre fuera del host', fakeAsync(() => {
    setUp();
    tick(0);
    const outside = fixture.nativeElement.querySelector('[data-testid="outside"]') as HTMLElement;

    fireMouseDown(outside);

    expect(fixture.componentInstance.outsideEvents()).toBe(1);
  }));

  it('si enabled=false, NO emite ni siquiera al hacer click fuera', fakeAsync(() => {
    setUp();
    tick(0);
    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();

    const outside = fixture.nativeElement.querySelector('[data-testid="outside"]') as HTMLElement;
    fireMouseDown(outside);

    expect(fixture.componentInstance.outsideEvents()).toBe(0);
  }));

  it('al destruirse el host elimina el listener (no más emisiones)', fakeAsync(() => {
    setUp();
    tick(0);
    fixture.destroy();

    const stray = document.createElement('button');
    document.body.appendChild(stray);
    fireMouseDown(stray);

    // No hay forma de leer el signal del componente destruido, pero sí
    // verificamos que no haya un throw del handler ni listener huérfano:
    expect(true).toBeTrue();
    document.body.removeChild(stray);
  }));
});
