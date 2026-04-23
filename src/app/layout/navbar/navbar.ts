import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { AvatarComponent } from '@shared/ui/avatar/avatar.component';
import { InvitacionService } from '@features/invitations/services/invitacion.service';

interface NavLink {
  readonly path: string;
  readonly label: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly invitacionService = inject(InvitacionService);

  readonly user = this.authService.currentUser;
  readonly pendingInvitations = this.invitacionService.pendingCount;

  readonly userDisplayName = computed(() => {
    const u = this.user();
    if (!u) return '';
    if (u.nombre) return `${u.nombre}${u.apellidos ? ' ' + u.apellidos : ''}`;
    return u.username;
  });

  readonly links: readonly NavLink[] = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/competitions', label: 'Competiciones' },
    { path: '/teams', label: 'Equipos' },
    { path: '/players', label: 'Jugadores' },
    { path: '/admin', label: 'Admin' },
  ];

  constructor() {
    // Recarga las invitaciones pendientes cuando cambia el usuario autenticado.
    effect(() => {
      const u = this.user();
      if (u) this.invitacionService.loadPendientes(u.id);
    });
  }

  ngOnInit(): void {
    const u = this.user();
    if (u) this.invitacionService.loadPendientes(u.id);
  }
}
