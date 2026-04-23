import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { interval, startWith, switchMap, takeUntil } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { ConversacionSimple } from '@core/models/mensaje';
import { ApiError } from '@core/http/api-error.model';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { AvatarComponent } from '@shared/ui/avatar/avatar.component';
import { ToastService } from '@shared/services/toast.service';
import { MensajeriaService } from '@features/messages/services/mensajeria.service';

@Component({
  selector: 'app-inbox-page',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    PageHeaderComponent,
    EmptyStateComponent,
    SpinnerComponent,
    AvatarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inbox.page.html',
  styleUrl: './inbox.page.scss',
})
export class InboxPage implements OnInit {
  private readonly service = inject(MensajeriaService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly conversaciones = this.service.conversaciones;

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Carga inicial + polling 30s mientras la página esté montada.
    interval(30_000)
      .pipe(
        startWith(0),
        switchMap(() => this.service.listar$()),
        takeUntil(this.destroy$),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: () => this.loading.set(false),
        error: (err: ApiError) => {
          this.loading.set(false);
          if (err.status !== 404) this.toast.error(err.message ?? 'Error al cargar mensajes');
        },
      });
  }
}
