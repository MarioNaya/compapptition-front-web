import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PageResponse } from '@core/models/comun/page.model';
import { LogModificacion } from '@core/models/log/log.model';
import { PageableRequest, toPageableParams } from '@core/http/pageable';

@Injectable({ providedIn: 'root' })
export class LogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/logs`;

  findByCompeticion$(
    competicionId: number,
    pageable: PageableRequest = {},
  ): Observable<PageResponse<LogModificacion>> {
    return this.http.get<PageResponse<LogModificacion>>(
      `${this.base}/competicion/${competicionId}`,
      { params: toPageableParams(pageable) },
    );
  }

  findByUsuario$(
    usuarioId: number,
    pageable: PageableRequest = {},
  ): Observable<PageResponse<LogModificacion>> {
    return this.http.get<PageResponse<LogModificacion>>(
      `${this.base}/usuario/${usuarioId}`,
      { params: toPageableParams(pageable) },
    );
  }

  findByEntidad$(entidad: string, entidadId: number): Observable<LogModificacion[]> {
    return this.http.get<LogModificacion[]>(`${this.base}/entidad/${entidad}/${entidadId}`);
  }
}
