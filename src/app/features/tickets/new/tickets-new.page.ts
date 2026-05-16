import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { ApiError } from '@core/http/api-error.model';
import { TicketService } from '@features/tickets/services/ticket.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-tickets-new-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    FormFieldComponent,
    ButtonComponent,
    SpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tickets-new.page.html',
  styleUrl: './tickets-new.page.scss',
})
export class TicketsNewPage {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TicketService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    asunto: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(160)],
    ],
    descripcion: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(4000)],
    ],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.service.crear$(this.form.getRawValue()).subscribe({
      next: (ticket) => {
        this.toast.success('Ticket enviado. Te avisaremos cuando lo atendamos.');
        this.router.navigate(['/app/tickets', ticket.id]);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        this.toast.error(err.message || 'No se pudo crear el ticket');
      },
    });
  }
}
