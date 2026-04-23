import { HttpParams } from '@angular/common/http';

export interface PageableRequest {
  readonly page?: number;
  readonly size?: number;
  readonly sort?: string;
}

/**
 * Convierte un PageableRequest a HttpParams compatible con Spring Pageable.
 * `extra` keys se envían siempre que no sean undefined/null — cadenas vacías SÍ se envían
 * porque algunos endpoints con @RequestParam sin required=false fallan si el param falta.
 */
export function toPageableParams(
  req: PageableRequest = {},
  extra: Record<string, string | number | undefined | null> = {},
): HttpParams {
  let params = new HttpParams();
  if (req.page !== undefined) params = params.set('page', String(req.page));
  if (req.size !== undefined) params = params.set('size', String(req.size));
  if (req.sort) params = params.set('sort', req.sort);
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null) {
      params = params.set(k, String(v));
    }
  }
  return params;
}
