import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NotificationService } from '@core/services/notification.service';
import { Notificacion, TipoNotificacion } from '@core/models/notificacion';
import { AuthService } from '@core/services/auth.service';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';

interface NotifView {
  readonly id: number;
  readonly icon: 'bell' | 'mail' | 'trophy' | 'users' | 'check';
  readonly title: string;
  readonly detail: string;
  readonly leida: boolean;
  readonly fechaCreacion: string;
  readonly link: readonly unknown[] | null;
}

const TITLES: Record<TipoNotificacion, string> = {
  INVITACION_RECIBIDA: 'Nueva invitación',
  EQUIPO_ACEPTADO: 'Equipo aceptado',
  RESULTADO_REGISTRADO: 'Resultado registrado',
  MENSAJE_RECIBIDO: 'Nuevo mensaje',
  COMPETICION_ACTIVADA: 'Competición activada',
};

const ICONS: Record<TipoNotificacion, NotifView['icon']> = {
  INVITACION_RECIBIDA: 'bell',
  EQUIPO_ACEPTADO: 'check',
  RESULTADO_REGISTRADO: 'trophy',
  MENSAJE_RECIBIDO: 'mail',
  COMPETICION_ACTIVADA: 'trophy',
};

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

  readonly items = computed<readonly NotifView[]>(() =>
    this.service.items().map((n) => this.toView(n)),
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

  onClick(n: NotifView): void {
    this.service.marcarLeida$(n.id).subscribe();
    this.close();
    if (n.link) this.router.navigate([...n.link]);
  }

  private toView(n: Notificacion): NotifView {
    const payload = n.payload ?? {};
    let detail = '';
    let link: readonly unknown[] | null = null;

    switch (n.tipo) {
      case TipoNotificacion.INVITACION_RECIBIDA: {
        detail = String(payload['competicionNombre'] ?? 'Revisa tu bandeja');
        link = ['/app/invitations'];
        break;
      }
      case TipoNotificacion.EQUIPO_ACEPTADO: {
        const team = payload['equipoNombre'] ?? '';
        const comp = payload['competicionNombre'] ?? '';
        detail = `${team}${comp ? ' · ' + comp : ''}`.trim() || 'Equipo aceptado en la competición';
        const compId = payload['competicionId'];
        link = compId != null ? ['/app/competitions', compId] : null;
        break;
      }
      case TipoNotificacion.RESULTADO_REGISTRADO: {
        detail = String(payload['resultado'] ?? 'Nuevo resultado en un partido');
        const compId = payload['competicionId'];
        const eventoId = payload['eventoId'];
        link = compId != null && eventoId != null ? ['/app/competitions', compId, 'events', eventoId] : null;
        break;
      }
      case TipoNotificacion.MENSAJE_RECIBIDO: {
        detail = String(payload['autorUsername'] ?? 'Tienes un nuevo mensaje');
        const convId = payload['conversacionId'];
        link = convId != null ? ['/app/messages', convId] : ['/app/messages'];
        break;
      }
      case TipoNotificacion.COMPETICION_ACTIVADA: {
        detail = String(payload['competicionNombre'] ?? 'Una competición ha empezado');
        const compId = payload['competicionId'];
        link = compId != null ? ['/app/competitions', compId] : null;
        break;
      }
    }

    return {
      id: n.id,
      icon: ICONS[n.tipo],
      title: TITLES[n.tipo] ?? 'Notificación',
      detail,
      leida: n.leida,
      fechaCreacion: n.fechaCreacion,
      link,
    };
  }
}
