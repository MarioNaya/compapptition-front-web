import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terminos-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './terminos.page.html',
  styleUrl: './terminos.page.scss',
})
export class TerminosPage {
  readonly fechaActualizacion = '2 de mayo de 2026';
}
