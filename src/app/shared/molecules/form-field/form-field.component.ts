import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import {
  PASSWORD_REQUIREMENT_LABELS,
  type PasswordRequirementsError,
} from '@shared/validators/password-requirements.validator';

/**
 * Reactive-forms-aware wrapper. Renders label, projects the input, and shows
 * the first validation error when the control is touched or dirty.
 *
 * Usage:
 *   <app-form-field label="Email" [control]="form.controls.email">
 *     <input class="input" type="email" formControlName="email" placeholder="tu@email.com" />
 *   </app-form-field>
 */
@Component({
  selector: 'app-form-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
})
export class FormFieldComponent {
  readonly label = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly control = input<AbstractControl | null>(null);
  readonly errorMessages = input<Record<string, string>>({});

  /**
   * Id estable del span de error/hint para que el input proyectado pueda
   * referirlo con {@code aria-describedby="..."} y el lector de pantalla
   * anuncie el mensaje al hacer focus (cierra AF-22). Los call-sites con
   * exigencia de a11y pueden hacer:
   * <pre>
   *   <app-form-field #f label="...">
   *     <input ... [attr.aria-describedby]="f.descriptionId" />
   *   </app-form-field>
   * </pre>
   */
  private static idCounter = 0;
  readonly descriptionId = `ff-${++FormFieldComponent.idCounter}`;

  // Tick que se incrementa en cada evento del FormControl (status/value/touch).
  // Necesario porque los computed() solo reaccionan a signals, y AbstractControl
  // es observable-based.
  private readonly tick = signal(0);

  constructor() {
    effect((onCleanup) => {
      const c = this.control();
      if (!c) return;
      const sub = c.events.subscribe(() => this.tick.update((n) => n + 1));
      onCleanup(() => sub.unsubscribe());
    });
  }

  readonly showError = computed(() => {
    this.tick();
    const c = this.control();
    if (!c || !c.invalid) return false;
    // Solo tras perder el foco (blur): touched.
    // Evita que patchValue o `dirty` programático disparen errores sin
    // que el usuario haya interactuado realmente con el campo.
    return c.touched;
  });

  readonly errorMessage = computed(() => {
    this.tick();
    const c = this.control();
    if (!c || !c.errors) return null;
    const first = Object.keys(c.errors)[0];
    const messages = this.errorMessages();
    return messages[first] ?? this.defaultMessage(first, c.errors[first]);
  });

  private defaultMessage(key: string, meta: unknown): string {
    switch (key) {
      case 'required':
        return 'Este campo es obligatorio';
      case 'email':
        return 'Email no válido';
      case 'minlength':
        return `Mínimo ${(meta as { requiredLength?: number })?.requiredLength ?? ''} caracteres`;
      case 'maxlength':
        return `Máximo ${(meta as { requiredLength?: number })?.requiredLength ?? ''} caracteres`;
      case 'pattern':
        return 'Formato no válido';
      case 'passwordRequirements': {
        const missing = (meta as PasswordRequirementsError)?.missing ?? [];
        const parts = missing.map((m) => PASSWORD_REQUIREMENT_LABELS[m]);
        return parts.length ? `La contraseña debe incluir ${parts.join(', ')}` : 'Contraseña inválida';
      }
      default:
        return 'Valor inválido';
    }
  }
}
