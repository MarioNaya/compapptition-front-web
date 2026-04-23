import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CompeticionSimple, EstadoCompeticion } from '@core/models/competicion/competicion.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { SearchBarComponent } from '@shared/molecules/search-bar/search-bar.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { CompetitionCardComponent } from '@shared/components/competition-card/competition-card.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { CompeticionService } from '@features/competitions/services/competicion.service';

interface FilterOption {
  readonly label: string;
  readonly value: EstadoCompeticion | 'ALL';
}

@Component({
  selector: 'app-competitions-list-page',
  standalone: true,
  imports: [
    ButtonComponent,
    IconComponent,
    PageHeaderComponent,
    SearchBarComponent,
    EmptyStateComponent,
    CompetitionCardComponent,
    SpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './competitions-list.page.html',
  styleUrl: './competitions-list.page.scss',
})
export class CompetitionsListPage implements OnInit {
  private readonly service = inject(CompeticionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  readonly loading = this.service.loading;
  readonly list = this.service.list;
  readonly search = signal('');
  readonly activeFilter = signal<EstadoCompeticion | 'ALL'>('ALL');

  readonly filters: readonly FilterOption[] = [
    { label: 'Todas', value: 'ALL' },
    { label: 'En curso', value: EstadoCompeticion.ACTIVA },
    { label: 'Borrador', value: EstadoCompeticion.BORRADOR },
    { label: 'Finalizada', value: EstadoCompeticion.FINALIZADA },
  ];

  readonly filteredList = computed<readonly CompeticionSimple[]>(() => {
    const filter = this.activeFilter();
    const all = this.list();
    if (filter === 'ALL') return all;
    return all.filter((c) => c.estado === filter);
  });

  constructor() {
    // El subscribe al subject se registra en el constructor (injection context),
    // así `takeUntilDestroyed()` sin arg funciona correctamente.
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((term) => {
        this.service.loadList({ search: term, size: 50 });
      });
  }

  ngOnInit(): void {
    this.service.loadList({ size: 50 });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.searchSubject.next(value);
  }

  setFilter(value: EstadoCompeticion | 'ALL'): void {
    this.activeFilter.set(value);
  }

  openDetail(c: CompeticionSimple): void {
    this.router.navigate(['/competitions', c.id]);
  }

  goToNew(): void {
    this.router.navigate(['/competitions/new']);
  }
}
