import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Equipo } from '@core/models/equipo/equipo.model';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { SearchBarComponent } from '@shared/molecules/search-bar/search-bar.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { TeamCardComponent } from '@shared/components/team-card/team-card.component';
import { ToastService } from '@shared/services/toast.service';
import { EquipoService } from '@features/teams/services/equipo.service';

@Component({
  selector: 'app-teams-list-page',
  standalone: true,
  imports: [
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    PageHeaderComponent,
    SearchBarComponent,
    EmptyStateComponent,
    TeamCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teams-list.page.html',
  styleUrl: './teams-list.page.scss',
})
export class TeamsListPage implements OnInit {
  private readonly service = inject(EquipoService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  readonly loading = signal(true);
  readonly equipos = signal<readonly Equipo[]>([]);
  readonly search = signal('');

  constructor() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((term) => this.load(term));
  }

  ngOnInit(): void {
    this.load('');
  }

  private load(term: string): void {
    this.loading.set(true);
    this.service.findAll$({ search: term || undefined, size: 50 }).subscribe({
      next: (page) => {
        this.equipos.set(page.content);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'Error al cargar equipos');
        this.loading.set(false);
      },
    });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.searchSubject.next(value);
  }

  open(e: Equipo): void {
    this.router.navigate(['/teams', e.id]);
  }

  goNew(): void {
    this.router.navigate(['/teams/new']);
  }
}
