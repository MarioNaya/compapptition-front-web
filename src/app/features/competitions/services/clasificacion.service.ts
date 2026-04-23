import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Clasificacion } from '@core/models/competicion/clasificacion.model';

@Injectable({ providedIn: 'root' })
export class ClasificacionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/clasificaciones`;

  findByCompeticionDetalle$(competicionId: number): Observable<Clasificacion[]> {
    return this.http.get<Clasificacion[]>(`${this.base}/competiciondetalle/${competicionId}`);
  }

  findByCompeticionSimple$(competicionId: number): Observable<Clasificacion[]> {
    return this.http.get<Clasificacion[]>(`${this.base}/competicionsimple/${competicionId}`);
  }

  recalcular$(competicionId: number): Observable<Clasificacion[]> {
    return this.http.post<Clasificacion[]>(
      `${this.base}/competicion/${competicionId}/recalcular`,
      null,
    );
  }
}
