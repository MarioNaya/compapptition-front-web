import type { FormGroup } from '@angular/forms';
import type { ApiError } from '@core/http/api-error.model';

/**
 * Toma los errores del backend y los planta como errores en los controles
 * correspondientes del FormGroup. Tras llamar a este helper, el FormField
 * de cada campo afectado mostrará el mensaje exacto del backend.
 *
 * Cubre dos formatos del backend:
 *   1. `error.errors` (Bean Validation, `@Size`/`@Pattern`/`@Email`/`@NotBlank`):
 *      mapa `campo → mensaje`. Marca cada control con `{ server: <mensaje> }`.
 *   2. `error.message` cuando el backend lanza `BadRequestException` con texto
 *      de duplicación ("ya está en uso", "ya está registrado"). Se infiere el
 *      campo del propio texto y se marca con `{ alreadyTaken: <mensaje> }`.
 *
 * Devuelve `true` si consiguió mapear el error a algún control concreto del
 * formulario (en cuyo caso el caller NO debería mostrar el toast genérico).
 * Devuelve `false` si el error no se pudo localizar a un campo concreto.
 */
export function applyServerErrors(form: FormGroup, error: ApiError): boolean {
  const mapped: string[] = [];

  if (error.errors) {
    for (const [field, message] of Object.entries(error.errors)) {
      const control = form.get(field);
      if (!control) continue;
      control.setErrors({ ...(control.errors ?? {}), server: message });
      control.markAsTouched();
      mapped.push(field);
    }
    if (mapped.length > 0) return true;
  }

  const message = error.message ?? '';
  const duplicateField = inferDuplicateField(message);
  if (duplicateField) {
    const control = form.get(duplicateField);
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), alreadyTaken: message });
      control.markAsTouched();
      return true;
    }
  }

  return false;
}

// Detecta mensajes del backend que indican un duplicado ya existente. Los
// mensajes vienen de AuthService.registro() — si cambian allí, hay que
// reajustar aquí. La detección es por palabras clave para tolerar pequeños
// matices de redacción.
function inferDuplicateField(message: string): string | null {
  const lower = message.toLowerCase();
  if (lower.includes('nombre de usuario') || lower.includes('username')) {
    return 'username';
  }
  if (lower.includes('email') || lower.includes('correo')) {
    return 'email';
  }
  return null;
}
