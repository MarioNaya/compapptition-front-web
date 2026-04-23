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
    { path: '/app/admin', label: 'Dashboard', icon: 'stats' },
    { path: '/app/admin/sports', label: 'Deportes', icon: 'trophy' },
    { path: '/app/admin/stat-types', label: 'Tipos estadística', icon: 'flag' },
    { path: '/app/admin/users', label: 'Usuarios', icon: 'users' },
    { path: '/app/admin/logs', label: 'Logs', icon: 'inbox' },
  ];
}
