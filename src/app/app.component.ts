import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { brandSet, flagSet, freeSet } from '@coreui/icons';
import { IconSetService } from '@coreui/icons-angular';

  @Component({
    selector: 'app-root',
    template: '<router-outlet />',
    imports: [RouterOutlet]
  })
  export class AppComponent {
    readonly #iconSetService = inject(IconSetService);

    constructor() {
      this.#iconSetService.icons = { ...brandSet, ...flagSet, ...freeSet };
    }
  }
