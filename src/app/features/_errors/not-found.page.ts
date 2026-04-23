import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './not-found.page.html',
  styleUrl: './not-found.page.scss',
})
export class NotFoundPage {
  private readonly auth = inject(AuthService);
  readonly homeLink = this.auth.isAuthenticated() ? '/app/dashboard' : '/';
  readonly homeLabel = this.auth.isAuthenticated() ? 'Ir al dashboard' : 'Ir al inicio';
}
