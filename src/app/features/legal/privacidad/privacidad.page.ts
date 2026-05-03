import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacidad-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacidad.page.html',
  styleUrl: './privacidad.page.scss',
})
export class PrivacidadPage {
  readonly fechaActualizacion = '2 de mayo de 2026';
}
