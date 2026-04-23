import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { ColumnDef } from './data-table.types';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NgTemplateOutlet, SpinnerComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T extends object = object> {
  readonly columns = input.required<readonly ColumnDef<T>[]>();
  readonly rows = input.required<readonly T[]>();
  readonly loading = input<boolean>(false);
  readonly rowKey = input<(row: T) => string | number>((r) => JSON.stringify(r));
  readonly rowClass = input<((row: T, index: number, total: number) => string | null) | null>(null);
  readonly emptyTitle = input<string>('Sin resultados');
  readonly emptySubtitle = input<string | null>(null);
  readonly clickable = input<boolean>(false);

  readonly rowClick = output<T>();

  onRowClick(row: T): void {
    if (!this.clickable()) return;
    this.rowClick.emit(row);
  }

  cellValue(row: T, col: ColumnDef<T>): unknown {
    if (col.accessor) return col.accessor(row);
    return (row as Record<string, unknown>)[col.key];
  }

  resolveRowClass(row: T, index: number): string | null {
    const fn = this.rowClass();
    return fn ? fn(row, index, this.rows().length) : null;
  }
}
