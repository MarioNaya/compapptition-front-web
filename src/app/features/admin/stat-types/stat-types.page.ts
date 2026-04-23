import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Deporte } from '@core/models/deporte/deporte.model';
import { TipoEstadistica, TipoValor } from '@core/models/estadistica/estadistica.model';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmDialogService } from '@shared/services/confirm-dialog.service';
import { DeporteService } from '@features/admin/sports/services/deporte.service';
import {
  TipoEstadisticaService,
  TipoEstadisticaRequest,
} from '@features/admin/stat-types/services/tipo-estadistica.service';

@Component({
  selector: 'app-stat-types-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    IconComponent,
    SpinnerComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    FormFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stat-types.page.html',
  styleUrl: './stat-types.page.scss',
})
export class StatTypesPage implements OnInit {
  private readonly deporteService = inject(DeporteService);
  private readonly service = inject(TipoEstadisticaService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly deportes = signal<readonly Deporte[]>([]);
  readonly selectedDeporteId = signal<number | null>(null);
  readonly tipos = signal<readonly TipoEstadistica[]>([]);
  readonly loading = signal(false);
  readonly editing = signal<TipoEstadistica | null>(null);
  readonly showForm = signal(false);
  readonly saving = signal(false);

  readonly TipoValor = TipoValor;

  readonly selectedDeporte = computed<Deporte | null>(() => {
    const id = this.selectedDeporteId();
    if (id == null) return null;
    return this.deportes().find((d) => d.id === id) ?? null;
  });

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    descripcion: [''],
    tipoValor: [TipoValor.ENTERO, [Validators.required]],
    orden: [0],
  });

  ngOnInit(): void {
    this.deporteService.findAll$().subscribe({
      next: (list) => {
        this.deportes.set(list);
        if (list.length > 0) this.selectDeporte(list[0].id);
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'Error al cargar deportes'),
    });
  }

  selectDeporte(id: number): void {
    this.selectedDeporteId.set(id);
    this.loadTipos(id);
  }

  private loadTipos(deporteId: number): void {
    this.loading.set(true);
    this.service.findByDeporte$(deporteId).subscribe({
      next: (list) => {
        this.tipos.set(list);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.toast.error(err.message ?? 'Error al cargar tipos');
        this.loading.set(false);
      },
    });
  }

  startCreate(): void {
    this.editing.set(null);
    this.form.reset({ nombre: '', descripcion: '', tipoValor: TipoValor.ENTERO, orden: 0 });
    this.showForm.set(true);
  }

  startEdit(t: TipoEstadistica): void {
    this.editing.set(t);
    this.form.reset({
      nombre: t.nombre,
      descripcion: t.descripcion ?? '',
      tipoValor: t.tipoValor,
      orden: t.orden,
    });
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  submit(): void {
    const deporteId = this.selectedDeporteId();
    if (deporteId == null) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nombre, descripcion, tipoValor, orden } = this.form.getRawValue();
    const req: TipoEstadisticaRequest = {
      nombre,
      descripcion: descripcion || undefined,
      tipoValor,
      orden,
    };
    this.saving.set(true);
    const editing = this.editing();
    const obs = editing
      ? this.service.update$(editing.id, req)
      : this.service.create$(deporteId, req);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(editing ? 'Tipo actualizado' : 'Tipo creado');
        this.showForm.set(false);
        this.editing.set(null);
        this.loadTipos(deporteId);
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.toast.error(err.message ?? 'Error al guardar');
      },
    });
  }

  async askDelete(t: TipoEstadistica): Promise<void> {
    const ok = await this.confirm.ask({
      title: '¿Eliminar tipo de estadística?',
      message: `"${t.nombre}" se eliminará. Las estadísticas ya registradas podrían verse afectadas.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    this.service.delete$(t.id).subscribe({
      next: () => {
        this.toast.success('Tipo eliminado');
        const id = this.selectedDeporteId();
        if (id != null) this.loadTipos(id);
      },
      error: (err: ApiError) => this.toast.error(err.message ?? 'No se pudo eliminar'),
    });
  }
}
