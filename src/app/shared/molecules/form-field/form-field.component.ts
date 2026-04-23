import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';

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
    return c.touched || c.dirty;
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
      default:
        return 'Valor inválido';
    }
  }
}
