import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { interval, startWith, switchMap, Subject, takeUntil } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Mensaje } from '@core/models/mensaje';
import { ApiError } from '@core/http/api-error.model';
import { AuthService } from '@core/services/auth.service';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { ToastService } from '@shared/services/toast.service';
import { MensajeriaService } from '@features/messages/services/mensajeria.service';

@Component({
  selector: 'app-conversation-page',
  standalone: true,
  imports: [FormsModule, DatePipe, ButtonComponent, IconComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './conversation.page.html',
  styleUrl: './conversation.page.scss',
})
export class ConversationPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(MensajeriaService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly conversacionId = toSignal(
    this.route.paramMap,
    { requireSync: false },
  );

  readonly loading = signal(true);
  readonly sending = signal(false);
  readonly mensajes = signal<readonly Mensaje[]>([]);
  readonly draft = signal('');
  readonly userId = computed(() => this.auth.currentUser()?.id ?? 0);

  private readonly destroy$ = new Subject<void>();
  private currentId: number | null = null;

  constructor() {
    effect(() => {
      const param = this.conversacionId()?.get('id');
      const id = param ? Number(param) : null;
      if (id != null && Number.isFinite(id) && id !== this.currentId) {
        this.currentId = id;
        this.startPolling(id);
      }
    });
  }

  ngOnInit(): void {
    // el effect del constructor arranca el polling al resolver el param.
  }

  private startPolling(id: number): void {
    this.destroy$.next(); // reset del polling anterior
    this.loading.set(true);

    interval(30_000)
      .pipe(
        startWith(0),
        switchMap(() => this.service.mensajes$(id)),
        takeUntil(this.destroy$),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => {
          // Backend devuelve DESC; invertimos para cronológico ascendente en UI.
          this.mensajes.set([...page.content].reverse());
          this.loading.set(false);
          // marcar como leídos en segundo plano
          this.service.marcarLeido$(id).subscribe();
        },
        error: (err: ApiError) => {
          this.loading.set(false);
          if (err.status !== 404) this.toast.error(err.message ?? 'Error al cargar mensajes');
        },
      });
  }

  send(): void {
    const id = this.currentId;
    const contenido = this.draft().trim();
    if (!id || !contenido) return;
    this.sending.set(true);
    this.service.enviar$(id, { contenido }).subscribe({
      next: (m) => {
        this.mensajes.update((msgs) => [...msgs, m]);
        this.draft.set('');
        this.sending.set(false);
      },
      error: (err: ApiError) => {
        this.sending.set(false);
        this.toast.error(err.message ?? 'No se pudo enviar');
      },
    });
  }

  onDraftChange(v: string): void {
    this.draft.set(v);
  }
}
