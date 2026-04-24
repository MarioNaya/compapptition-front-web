import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { AccionLog, LogModificacion } from '@core/models/log/log.model';
import { ApiError } from '@core/http/api-error.model';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { TagComponent, TagVariant } from '@shared/ui/tag/tag.component';
import { PageHeaderComponent } from '@shared/molecules/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/molecules/empty-state/empty-state.component';
import { FormFieldComponent } from '@shared/molecules/form-field/form-field.component';
import { DataTableComponent } from '@shared/components/data-table/data-table.component';
import { ColumnDef } from '@shared/components/data-table/data-table.types';
import { ToastService } from '@shared/services/toast.service';
import { LogService } from '@features/admin/logs/services/log.service';

type FilterMode = 'usuario' | 'competicion';

const ACCION_VARIANT: Record<AccionLog, TagVariant> = {
  [AccionLog.CREAR]: 'green',
  [AccionLog.EDITAR]: 'orange',
  [AccionLog.ELIMINAR]: 'red',
};

@Component({
  selector: 'app-admin-logs-page',
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
  templateUrl: './logs.page.html',
  styleUrl: './logs.page.scss',
})
export class AdminLogsPage implements OnInit {
  private readonly service = inject(LogService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly mode = signal<FilterMode>('usuario');
  readonly loading = signal(false);
  readonly logs = signal<readonly LogModificacion[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly searched = signal(false);

  readonly form = this.fb.nonNullable.group({
    id: [0, [Validators.required, Validators.min(1)]],
  });

  readonly hasNext = computed(() => this.page() + 1 < this.totalPages());
  readonly hasPrev = computed(() => this.page() > 0);

  readonly columns: readonly ColumnDef<LogModificacion>[] = [
    {
      key: 'fechaModificacion',
      label: 'Fecha',
      width: '180px',
      accessor: (l) => l.fechaModificacion,
    },
    { key: 'usuarioUsername', label: 'Usuario', width: '160px' },
    { key: 'accion', label: 'Acción', width: '120px' },
    { key: 'entidadTipo', label: 'Entidad', width: '140px' },
    { key: 'descripcion', label: 'Descripción' },
  ];

  readonly rowKey = (l: LogModificacion) => l.id;

  ngOnInit(): void {
    const userId = this.auth.currentUser()?.id;
    if (userId) this.form.controls.id.setValue(userId);
  }

  setMode(m: FilterMode): void {
    this.mode.set(m);
    this.logs.set([]);
    this.searched.set(false);
    this.page.set(0);
    // Al cambiar a modo usuario pre-cargamos el ID del user autenticado (único
    // que puede consultar sus logs sin ser ADMIN_SISTEMA). En modo competición
    // el usuario debe introducir un ID de una competición que administre.
    if (m === 'usuario') {
      const userId = this.auth.currentUser()?.id;
      if (userId) this.form.controls.id.setValue(userId);
    } else {
      this.form.controls.id.setValue(0);
    }
  }

  variantFor(accion: AccionLog): TagVariant {
    return ACCION_VARIANT[accion] ?? 'gray';
  }

  search(page = 0): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const id = this.form.controls.id.value;
    this.loading.set(true);
    this.searched.set(true);
    const obs =
      this.mode() === 'usuario'
        ? this.service.findByUsuario$(id, { page, size: 10 })
        : this.service.findByCompeticion$(id, { page, size: 10 });
    obs.subscribe({
      next: (resp) => {
        this.logs.set(resp.content);
        this.page.set(resp.pageNumber);
        this.totalPages.set(resp.totalPages);
        this.totalElements.set(resp.totalElements);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.loading.set(false);
        if (err.status === 403) {
          const msg = this.mode() === 'usuario'
            ? 'Solo puedes consultar tu propio histórico.'
            : 'Solo el administrador de esa competición puede ver su histórico.';
          this.toast.error(msg);
        } else {
          this.toast.error(err.message ?? 'Error al cargar logs');
        }
      },
    });
  }

  next(): void {
    if (this.hasNext()) this.search(this.page() + 1);
  }

  prev(): void {
    if (this.hasPrev()) this.search(this.page() - 1);
  }
}
