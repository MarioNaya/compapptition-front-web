import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { FormFieldComponent } from './form-field.component';
import { passwordRequirementsValidator } from '@shared/validators/password-requirements.validator';

describe('FormFieldComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [FormFieldComponent] });
  });

  function setup(control: FormControl, errorMessages: Record<string, string> = {}) {
    const fixture = TestBed.createComponent(FormFieldComponent);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('errorMessages', errorMessages);
    fixture.detectChanges();
    return fixture;
  }

  it('control válido: showError=false y errorMessage=null', () => {
    const c = new FormControl('ok', [Validators.required]);
    const fixture = setup(c);
    expect(fixture.componentInstance.showError()).toBeFalse();
    expect(fixture.componentInstance.errorMessage()).toBeNull();
  });

  it('inválido pero NO touched: showError=false (evita errores prematuros)', () => {
    const c = new FormControl('', [Validators.required]);
    const fixture = setup(c);
    expect(c.invalid).toBeTrue();
    expect(c.touched).toBeFalse();
    expect(fixture.componentInstance.showError()).toBeFalse();
  });

  it('inválido y touched: showError=true y mensaje "Este campo es obligatorio" para required', () => {
    const c = new FormControl('', [Validators.required]);
    const fixture = setup(c);

    c.markAsTouched();
    c.updateValueAndValidity();
    fixture.detectChanges();

    expect(fixture.componentInstance.showError()).toBeTrue();
    expect(fixture.componentInstance.errorMessage()).toBe('Este campo es obligatorio');
  });

  it('errorMessages personalizado tiene prioridad sobre el mensaje por defecto', () => {
    const c = new FormControl('', [Validators.required]);
    const fixture = setup(c, { required: 'Falta rellenar' });

    c.markAsTouched();
    c.updateValueAndValidity();
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMessage()).toBe('Falta rellenar');
  });

  it('mensaje por defecto para minlength incluye el requiredLength', () => {
    const c = new FormControl('a', [Validators.minLength(5)]);
    const fixture = setup(c);

    c.markAsTouched();
    c.updateValueAndValidity();
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMessage()).toBe('Mínimo 5 caracteres');
  });

  it('mensaje por defecto para email validador', () => {
    const c = new FormControl('no-es-email', [Validators.email]);
    const fixture = setup(c);

    c.markAsTouched();
    c.updateValueAndValidity();
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMessage()).toBe('Email no válido');
  });

  it('mensaje por defecto para passwordRequirements enumera los requisitos que faltan', () => {
    const c = new FormControl('abc', [passwordRequirementsValidator]);
    const fixture = setup(c);

    c.markAsTouched();
    c.updateValueAndValidity();
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMessage()).toBe(
      'La contraseña debe incluir 8 caracteres, una mayúscula, un dígito',
    );
  });

  it('descriptionId único por instancia', () => {
    const c1 = new FormControl('');
    const c2 = new FormControl('');
    const f1 = setup(c1);
    const f2 = setup(c2);
    expect(f1.componentInstance.descriptionId).not.toBe(f2.componentInstance.descriptionId);
  });
});
