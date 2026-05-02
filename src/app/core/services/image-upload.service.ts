import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '@env/environment';

export type UploadFolder = 'escudos' | 'fotos' | 'iconos' | 'misc';

export interface UploadResponse {
  readonly url: string;
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/imagenes`;

  /**
   * Valida el archivo y lo sube al backend (que a su vez firma y lo sube a Cloudinary).
   * Las validaciones cliente se transportan vía {@code throwError} dentro del
   * Observable (en lugar de lanzar síncrono); así los consumidores las reciben
   * por el callback {@code error:} del subscribe sin necesidad de try/catch
   * (cierra AF-12).
   */
  upload$(file: File, folder: UploadFolder = 'misc'): Observable<UploadResponse> {
    if (!ALLOWED_TYPES.has(file.type)) {
      return throwError(() => new Error('Formato no admitido. Usa JPG, PNG, WebP o GIF.'));
    }
    if (file.size > MAX_SIZE_BYTES) {
      return throwError(() => new Error(`El archivo supera el máximo de ${MAX_SIZE_BYTES / 1024 / 1024} MB.`));
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    return this.http.post<UploadResponse>(`${this.base}/upload`, fd);
  }
}
