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
import { EquipoService } from '@features/teams/services/equipo.service';
import { RolCompeticion } from '@core/models/rol';
import { TourService } from '@core/services/tour.service';
import { findTourForRoute } from '@core/services/tour.registry';
import { ToastService } from '@shared/services/toast.service';
import { NotificationService } from '@core/services/notification.service';

interface NavLink {
  readonly path: string;
  readonly label: string;
  readonly adminOnly?: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    IconComponent,
    AvatarComponent,
    NotificationBellComponent,
    ClickOutsideDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly invitacionService = inject(InvitacionService);
  private readonly mensajeriaService = inject(MensajeriaService);
  private readonly equipoService = inject(EquipoService);
  private readonly notificationService = inject(NotificationService);
  private readonly tour = inject(TourService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly user = this.authService.currentUser;
  readonly pendingInvitations = this.invitacionService.pendingCount;
  readonly unreadMessages = this.mensajeriaService.unreadTotal;
  readonly unreadNotifs = this.notificationService.unreadCount;

  /**
   * Marcador combinado para el avatar en móvil: suma de notificaciones e
   * mensajes no leídos. En desktop el badge se ve en cada icono directo;
   * en móvil esos iconos se ocultan y el avatar es el único punto de aviso.
   */
  readonly mobileBadgeCount = computed(() => this.unreadMessages() + this.unreadNotifs());

  readonly isAdmin = computed(() => !!this.user()?.esAdminSistema);

  /**
   * Cuántos equipos ha creado el usuario (sin necesidad de estar inscritos en
   * competiciones). Lo cargamos al iniciar para decidir si mostrar el link
   * "Equipos" del nav: aparece si tiene roles team-related en el JWT o si ha
   * creado al menos un equipo.
   */
  private readonly equiposCreadosCount = signal(0);

  /**
   * El link a "Equipos" se muestra a creadores, managers y jugadores. Para
   * los dos últimos miramos los roles del JWT; para el creador miramos el
   * resultado de `misEquiposCreados$`.
   */
  readonly hasTeams = computed(() => {
    if (this.equiposCreadosCount() > 0) return true;
    const roles = this.user()?.rolesCompeticion ?? [];
    return roles.some(
      (r) => r.rol === RolCompeticion.MANAGER_EQUIPO || r.rol === RolCompeticion.JUGADOR,
    );
  });

  readonly userDisplayName = computed(() => {
    const u = this.user();
    if (!u) return '';
    if (u.nombre) return `${u.nombre}${u.apellidos ? ' ' + u.apellidos : ''}`;
    return u.username;
  });

  private readonly allLinks: readonly (NavLink & { teamsOnly?: boolean })[] = [
    { path: '/app/dashboard', label: 'Dashboard' },
    { path: '/app/competitions', label: 'Competiciones' },
    { path: '/app/teams', label: 'Equipos', teamsOnly: true },
    { path: '/app/admin', label: 'Admin', adminOnly: true },
  ];

  readonly links = computed<readonly NavLink[]>(() =>
    this.allLinks.filter((l) => {
      if (l.adminOnly) return this.isAdmin();
      if (l.teamsOnly) return this.hasTeams();
      return true;
    }),
  );

  // hamburger en móvil
  readonly menuOpen = signal(false);
  // dropdown del botón +
  readonly createOpen = signal(false);
  // dropdown del avatar (perfil/mensajes/notifs/tutorial/logout)
  readonly profileOpen = signal(false);

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
      // Cuenta de equipos creados (cubre el caso de un creador sin rol todavía
      // en ninguna competición). Si el endpoint falla lo ignoramos: el link
      // "Equipos" aparece igualmente si el JWT tiene roles team-related.
      this.equipoService.misEquiposCreados$(u.id).subscribe({
        next: (list) => this.equiposCreadosCount.set(list.length),
        error: () => this.equiposCreadosCount.set(0),
      });
    }
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
    if (this.menuOpen()) {
      this.createOpen.set(false);
      this.profileOpen.set(false);
    }
  }

  toggleCreate(): void {
    this.createOpen.update((v) => !v);
    if (this.createOpen()) {
      this.menuOpen.set(false);
      this.profileOpen.set(false);
    }
  }

  toggleProfile(): void {
    this.profileOpen.update((v) => !v);
    if (this.profileOpen()) {
      this.menuOpen.set(false);
      this.createOpen.set(false);
    }
  }

  logout(): void {
    this.closeMenus();
    this.authService.logout();
  }

  closeMenus(): void {
    this.menuOpen.set(false);
    this.createOpen.set(false);
    this.profileOpen.set(false);
  }

  /**
   * Arranca el tour guiado correspondiente a la URL actual. Si no hay tour
   * registrado para esta vista mostramos un toast informativo en lugar de
   * desactivar silenciosamente el botón.
   */
  startTour(): void {
    const tour = findTourForRoute(this.router.url);
    if (!tour) {
      this.toast.info('No hay tour disponible para esta vista');
      return;
    }
    this.tour.start(tour.steps);
  }
}
