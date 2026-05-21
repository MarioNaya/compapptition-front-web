import { FormBuilder, type FormGroup } from '@angular/forms';
import type { ApiError } from '@core/http/api-error.model';
import { applyServerErrors } from './apply-server-errors';

function buildForm(): FormGroup {
  return new FormBuilder().nonNullable.group({
    username: [''],
    email: [''],
    password: [''],
  });
}

describe('applyServerErrors', () => {
  it('mapea errors.<campo> a setErrors({ server }) en el control correspondiente', () => {
    const form = buildForm();
    const err: ApiError = {
      status: 400,
      message: 'Error de validación en los campos',
      errors: { username: 'El nombre de usuario es obligatorio' },
    };

    const mapped = applyServerErrors(form, err);

    expect(mapped).toBeTrue();
    expect(form.controls['username'].errors).toEqual({ server: 'El nombre de usuario es obligatorio' });
    expect(form.controls['username'].touched).toBeTrue();
  });

  it('infiere "username" cuando el mensaje habla de "nombre de usuario"', () => {
    const form = buildForm();
    const err: ApiError = { status: 400, message: 'El nombre de usuario ya está en uso' };

    const mapped = applyServerErrors(form, err);

    expect(mapped).toBeTrue();
    expect(form.controls['username'].errors).toEqual({ alreadyTaken: 'El nombre de usuario ya está en uso' });
  });

  it('infiere "email" cuando el mensaje habla de "email"', () => {
    const form = buildForm();
    const err: ApiError = { status: 400, message: 'El email ya está registrado' };

    const mapped = applyServerErrors(form, err);

    expect(mapped).toBeTrue();
    expect(form.controls['email'].errors).toEqual({ alreadyTaken: 'El email ya está registrado' });
  });

  it('devuelve false cuando no encuentra ningún campo coincidente', () => {
    const form = buildForm();
    const err: ApiError = { status: 500, message: 'Algo ha fallado' };

    const mapped = applyServerErrors(form, err);

    expect(mapped).toBeFalse();
  });

  it('preserva errores previos del control al añadir el del servidor', () => {
    const form = buildForm();
    form.controls['username'].setErrors({ required: true });
    const err: ApiError = {
      status: 400,
      message: 'Validation Error',
      errors: { username: 'Debe tener entre 3 y 50 caracteres' },
    };

    applyServerErrors(form, err);

    expect(form.controls['username'].errors).toEqual({
      required: true,
      server: 'Debe tener entre 3 y 50 caracteres',
    });
  });
});
