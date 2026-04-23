import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { ImageUploadService, UploadFolder } from '@core/services/image-upload.service';
import { ApiError } from '@core/http/api-error.model';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [IconComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss',
})
export class ImageUploadComponent {
  private readonly service = inject(ImageUploadService);
  private readonly toast = inject(ToastService);

  readonly currentUrl = input<string | null>(null);
  readonly folder = input<UploadFolder>('misc');
  readonly label = input<string>('Subir imagen');
  readonly shape = input<'circle' | 'square'>('circle');

  readonly urlChanged = output<string>();
  readonly cleared = output<void>();

  readonly uploading = signal(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    try {
      this.service.upload$(file, this.folder()).subscribe({
        next: (res) => {
          this.uploading.set(false);
          this.urlChanged.emit(res.url);
          this.toast.success('Imagen subida');
        },
        error: (err: ApiError) => {
          this.uploading.set(false);
          this.toast.error(err.message ?? 'No se pudo subir la imagen');
        },
      });
    } catch (e) {
      this.uploading.set(false);
      this.toast.error((e as Error).message);
    } finally {
      // Reset input para permitir volver a seleccionar el mismo archivo
      input.value = '';
    }
  }

  clear(): void {
    this.cleared.emit();
  }
}
