import { TemplateRef } from '@angular/core';

export interface ColumnDef<T> {
  readonly key: string;
  readonly label: string;
  readonly width?: string;
  readonly align?: 'start' | 'center' | 'end';
  readonly accessor?: (row: T) => unknown;
  readonly cellTemplate?: TemplateRef<{ $implicit: T; value: unknown }>;
}
