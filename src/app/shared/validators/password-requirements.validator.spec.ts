import { FormControl } from '@angular/forms';
import {
  passwordRequirementsValidator,
  type PasswordRequirementsError,
} from './password-requirements.validator';

describe('passwordRequirementsValidator', () => {
  function run(value: string) {
    return passwordRequirementsValidator(new FormControl(value));
  }

  it('vacío: null (lo cubre Validators.required)', () => {
    expect(run('')).toBeNull();
  });

  it('válida (8+, mayúscula, dígito): null', () => {
    expect(run('Password1')).toBeNull();
  });

  it('falta longitud, mayúscula y dígito: lista los tres', () => {
    const err = run('abc') as { passwordRequirements: PasswordRequirementsError };
    expect(err.passwordRequirements.missing).toEqual(['minLength', 'uppercase', 'digit']);
  });

  it('falta solo la mayúscula', () => {
    const err = run('password1') as { passwordRequirements: PasswordRequirementsError };
    expect(err.passwordRequirements.missing).toEqual(['uppercase']);
  });

  it('falta solo el dígito', () => {
    const err = run('Password') as { passwordRequirements: PasswordRequirementsError };
    expect(err.passwordRequirements.missing).toEqual(['digit']);
  });

  it('falta solo la longitud', () => {
    const err = run('Pass1') as { passwordRequirements: PasswordRequirementsError };
    expect(err.passwordRequirements.missing).toEqual(['minLength']);
  });
});
