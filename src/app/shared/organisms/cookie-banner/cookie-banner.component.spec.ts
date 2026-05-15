import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CookieBannerComponent } from './cookie-banner.component';

const KEY = 'compapptition.cookie-notice-ack';

describe('CookieBannerComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CookieBannerComponent],
      providers: [provideRouter([])],
    });
  });

  afterEach(() => localStorage.clear());

  it('arranca visible cuando no hay flag persistida', () => {
    const fixture = TestBed.createComponent(CookieBannerComponent);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('.cookie-banner')).toBeTruthy();
  });

  it('NO se muestra si la flag ya está persistida en localStorage', () => {
    localStorage.setItem(KEY, '1');
    const fixture = TestBed.createComponent(CookieBannerComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.cookie-banner')).toBeNull();
  });

  it('al pulsar "Entendido": persiste el flag y oculta el banner', () => {
    const fixture = TestBed.createComponent(CookieBannerComponent);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.cookie-banner-button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(localStorage.getItem(KEY)).toBe('1');
    expect((fixture.nativeElement as HTMLElement).querySelector('.cookie-banner')).toBeNull();
  });
});
