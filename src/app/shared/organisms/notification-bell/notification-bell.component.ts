import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/services/auth.service';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { NotificationView, toNotificationView } from '@shared/utils/notification-mapper.util';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [RouterLink, DatePipe, IconComponent, ClickOutsideDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
})
export class NotificationBellComponent implements OnInit {
  private readonly service = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly unreadCount = this.service.unreadCount;
  readonly open = signal(false);

  readonly items = computed<readonly NotificationView[]>(() =>
    this.service.items().map((n) => toNotificationView(n)),
  );

  constructor() {
    // Conecta/desconecta SSE según el estado de auth.
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.service.connect();
      } else {
        this.service.disconnect();
      }
    });

    this.destroyRef.onDestroy(() => this.service.disconnect());
  }

  ngOnInit(): void {
    // Carga inicial del listado.
    if (this.auth.isAuthenticated()) {
      this.service.listar$(0, 10).subscribe();
    }
  }

  toggle(): void {
    this.open.update((v) => !v);
    if (this.open()) this.service.listar$(0, 10).subscribe();
  }

  close(): void {
    this.open.set(false);
  }

  markAll(): void {
    this.service.marcarTodasLeidas$().subscribe();
  }

  onClick(n: NotificationView): void {
    this.service.marcarLeida$(n.id).subscribe();
    this.close();
    if (n.link) this.router.navigate([...n.link]);
  }

  remove(n: NotificationView, ev: Event): void {
    ev.stopPropagation();
    this.service.eliminar$(n.id).subscribe();
  }
}
