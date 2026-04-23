import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-host.component.html',
  styleUrl: './toast-host.component.scss',
})
export class ToastHostComponent {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
