import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  private readonly service = inject(ConfirmDialogService);
  readonly active = this.service.active;

  confirm(): void {
    this.service.respond(true);
  }

  cancel(): void {
    this.service.respond(false);
  }
}
