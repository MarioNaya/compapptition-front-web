import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Deporte } from '@core/models/deporte/deporte.model';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { TagComponent } from '@shared/ui/tag/tag.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { ColumnDef } from '@shared/components/data-table/data-table.types';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { DeporteService, DeporteRequest } from './services/deporte.service';

@Component({
  selector: 'app-sports-list-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    TagComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    FormFieldComponent,
    DataTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sports-list.page.html',
  styleUrl: './sports-list.page.scss',
})
export class SportsListPage implements OnInit {
  private readonly service = inject(DeporteService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly loading = signal(false);
  readonly deportes = signal<readonly Deporte[]>([]);
  readonly editing = signal<Deporte | null>(null);
  readonly showForm = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    descripcion: [''],
    iconoUrl: [''],
    activo: [true],
  });

  readonly columns: readonly ColumnDef<Deporte>[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción', accessor: (d) => d.descripcion ?? '—' },
    { key: 'iconoUrl', label: 'Icono', width: '120px', accessor: (d) => d.iconoUrl ?? '—' },
    { key: 'activo', label: 'Estado', width: '100px', accessor: (d) => (d.activo ? 'Activo' : 'Inactivo') },
  ];

  readonly rowKey = (d: Deporte) => d.id;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.findAll$().subscribe({
      next: (list) => {
        this.deportes.set(list);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'Error al cargar deportes');
        this.loading.set(false);
      },
    });
  }

  startCreate(): void {
    this.editing.set(null);
    this.form.reset({ nombre: '', descripcion: '', iconoUrl: '', activo: true });
    this.showForm.set(true);
  }

  startEdit(d: Deporte): void {
    this.editing.set(d);
    this.form.reset({
      nombre: d.nombre,
      descripcion: d.descripcion ?? '',
      iconoUrl: d.iconoUrl ?? '',
      activo: d.activo,
    });
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nombre, descripcion, iconoUrl, activo } = this.form.getRawValue();
    const req: DeporteRequest = {
      nombre,
      descripcion: descripcion || undefined,
      iconoUrl: iconoUrl || undefined,
      activo,
    };
    this.saving.set(true);
    const editing = this.editing();
    const obs = editing ? this.service.update$(editing.id, req) : this.service.create$(req);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(editing ? 'Deporte actualizado' : 'Deporte creado');
        this.showForm.set(false);
        this.editing.set(null);
        this.load();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.toast.error(err.message ?? 'Error al guardar');
      },
    });
  }

  async askDelete(d: Deporte): Promise<void> {
    const ok = await this.confirm.ask({
      title: '¿Eliminar deporte?',
      message: `"${d.nombre}" se eliminará. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    this.service.delete$(d.id).subscribe({
      next: () => {
        this.toast.success('Deporte eliminado');
        this.load();
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo eliminar'),
    });
  }
}
