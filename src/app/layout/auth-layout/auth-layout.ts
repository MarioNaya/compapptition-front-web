import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ToastHostComponent } from '@shared/molecules/toast-host/toast-host.component';
import { OPERATIONAL_CONTACT_MAILTO } from '@core/config/contact';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ToastHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {
  readonly year = new Date().getFullYear();
  readonly supportMailto = OPERATIONAL_CONTACT_MAILTO;
}
