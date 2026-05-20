import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface PasswordRequirementsError {
  missing: PasswordRequirement[];
}

export type PasswordRequirement = 'minLength' | 'uppercase' | 'digit';

const MIN_LENGTH = 8;

export const PASSWORD_REQUIREMENT_LABELS: Record<PasswordRequirement, string> = {
  minLength: `${MIN_LENGTH} caracteres`,
  uppercase: 'una mayúscula',
  digit: 'un dígito',
};

// Alineado con backend RegistroRequest: @Size(min=8) + @Pattern((?=.*[A-Z])(?=.*\d)).
// Devuelve la lista de requisitos que faltan para que FormFieldComponent
// pueda enumerarlos en el mensaje de error.
export function passwordRequirementsValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (typeof value !== 'string' || value.length === 0) return null;
  const missing: PasswordRequirement[] = [];
  if (value.length < MIN_LENGTH) missing.push('minLength');
  if (!/[A-Z]/.test(value)) missing.push('uppercase');
  if (!/\d/.test(value)) missing.push('digit');
  if (missing.length === 0) return null;
  const error: PasswordRequirementsError = { missing };
  return { passwordRequirements: error };
}

export const passwordRequirements: ValidatorFn = passwordRequirementsValidator;
