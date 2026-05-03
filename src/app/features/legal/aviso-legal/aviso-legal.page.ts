import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-aviso-legal-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './aviso-legal.page.html',
  styleUrl: './aviso-legal.page.scss',
})
export class AvisoLegalPage {
  readonly fechaActualizacion = '2 de mayo de 2026';
}
