import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/services/auth.service';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { AvatarComponent } from '@shared/ui/avatar/avatar.component';
import { NotificationBellComponent } from '@shared/organisms/notification-bell/notification-bell.component';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { InvitacionService } from '@features/invitations/services/invitacion.service';
import { MensajeriaService } from '@features/messages/services/mensajeria.service';

interface NavLink {
  readonly path: string;
  readonly label: string;
  readonly adminOnly?: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent, AvatarComponent, NotificationBellComponent, ClickOutsideDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly invitacionService = inject(InvitacionService);
  private readonly mensajeriaService = inject(MensajeriaService);
  private readonly router = inject(Router);

  readonly user = this.authService.currentUser;
  readonly pendingInvitations = this.invitacionService.pendingCount;
  readonly unreadMessages = this.mensajeriaService.unreadTotal;

  readonly isAdmin = computed(() => !!this.user()?.esAdminSistema);

  readonly userDisplayName = computed(() => {
    const u = this.user();
    if (!u) return '';
    if (u.nombre) return `${u.nombre}${u.apellidos ? ' ' + u.apellidos : ''}`;
    return u.username;
  });

  private readonly allLinks: readonly NavLink[] = [
    { path: '/app/dashboard', label: 'Dashboard' },
    { path: '/app/competitions', label: 'Competiciones' },
    { path: '/app/admin', label: 'Admin', adminOnly: true },
  ];

  readonly links = computed<readonly NavLink[]>(() =>
    this.allLinks.filter((l) => !l.adminOnly || this.isAdmin()),
  );

  // hamburger en móvil
  readonly menuOpen = signal(false);
  // dropdown del botón +
  readonly createOpen = signal(false);

  constructor() {
    // Recarga invitaciones pendientes al cambiar el usuario autenticado.
    effect(() => {
      const u = this.user();
      if (u) this.invitacionService.loadPendientes(u.id);
    });

    // Cierra menús al navegar.
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuOpen.set(false);
        this.createOpen.set(false);
      });
  }

  ngOnInit(): void {
    const u = this.user();
    if (u) {
      this.invitacionService.loadPendientes(u.id);
      this.mensajeriaService.refresh();
    }
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
    if (this.menuOpen()) this.createOpen.set(false);
  }

  toggleCreate(): void {
    this.createOpen.update((v) => !v);
    if (this.createOpen()) this.menuOpen.set(false);
  }

  closeMenus(): void {
    this.menuOpen.set(false);
    this.createOpen.set(false);
  }
}
