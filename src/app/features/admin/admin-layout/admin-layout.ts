import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent, IconName } from '@shared/ui/icon/icon.component';

interface AdminLink {
  readonly path: string;
  readonly label: string;
  readonly icon: IconName;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  readonly links: readonly AdminLink[] = [
    { path: '/admin', label: 'Dashboard', icon: 'stats' },
    { path: '/admin/sports', label: 'Deportes', icon: 'trophy' },
    { path: '/admin/stat-types', label: 'Tipos estadística', icon: 'flag' },
    { path: '/admin/users', label: 'Usuarios', icon: 'users' },
    { path: '/admin/logs', label: 'Logs', icon: 'inbox' },
  ];
}
