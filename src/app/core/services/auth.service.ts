import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env/environment';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  RegistroRequest,
  Usuario,
  UsuarioRolCompeticionResumen,
} from '../models/usuario';
import { RolCompeticion } from '../models/rol/rol.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';

  private currentUserSignal = signal<Usuario | null>(this.getStoredUser());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, request).pipe(
      tap((response) => this.handleAuthResponse(response)),
      catchError((error) => throwError(() => error)),
    );
  }

  registro(request: RegistroRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/registro`, request)
      .pipe(
        tap((response) => this.handleAuthResponse(response)),
        catchError((error) => throwError(() => error)),
      );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken })
      .pipe(
        tap((response) => this.handleAuthResponse(response)),
        catchError((error) => {
          this.logout();
          return throwError(() => error);
        }),
      );
  }

  logout(): void {
    // Garantiza la limpieza local aunque el POST al backend falle (401, 500,
    // timeout, sin red): finalize se dispara tanto en next como en error.
    this.http
      .post(`${this.API_URL}/logout`, {})
      .pipe(finalize(() => this.clearSession()))
      .subscribe({
        error: () => {
          // Silenciar: clearSession ya se encarga de limpiar la sesión local.
        },
      });
  }

  recuperarPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_URL}/recuperar-password`,
      { email },
    );
  }

  resetPassword(
    token: string,
    password: string,
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_URL}/reset-password`,
      { token, password },
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /// === HELPERS RBAC ===
  ///
  /// Operan sobre el claim `competiciones` del JWT (decodificado al hacer login)
  /// y permiten que las páginas oculten o deshabiliten acciones sin esperar
  /// al backend. El backend siempre repite la comprobación con `@PreAuthorize`.

  /** El usuario tiene rol global de admin del sistema (atajo, supera todo lo demás). */
  isAdminSistema(): boolean {
    return !!this.currentUserSignal()?.esAdminSistema;
  }

  /** Roles del usuario en una competición concreta (tras decodificar el JWT). */
  rolesEnCompeticion(competicionId: number | null | undefined): RolCompeticion[] {
    if (competicionId == null) return [];
    return (this.currentUserSignal()?.rolesCompeticion ?? [])
      .filter((r) => r.id === competicionId)
      .map((r) => r.rol);
  }

  hasRole(competicionId: number | null | undefined, rol: RolCompeticion): boolean {
    if (this.isAdminSistema()) return true;
    return this.rolesEnCompeticion(competicionId).includes(rol);
  }

  /** Admin de la competición concreta (incluye admin de sistema). */
  isAdminCompeticion(competicionId: number | null | undefined): boolean {
    return this.hasRole(competicionId, RolCompeticion.ADMIN_COMPETICION);
  }

  /** Árbitro de la competición. */
  isArbitroCompeticion(competicionId: number | null | undefined): boolean {
    return this.hasRole(competicionId, RolCompeticion.ARBITRO);
  }

  /**
   * Puede registrar/editar resultados y estadísticas en la competición.
   * Lo permitimos a admin de competición y árbitros (admin de sistema incluido).
   */
  puedeEditarResultadosEnCompeticion(competicionId: number | null | undefined): boolean {
    return this.isAdminCompeticion(competicionId) || this.isArbitroCompeticion(competicionId);
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    const enriched: Usuario = {
      ...response.usuario,
      rolesCompeticion: this.parseRolesFromJwt(response.accessToken),
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(enriched));
    this.currentUserSignal.set(enriched);
  }

  /**
   * Decodifica el JWT y devuelve el claim `competiciones` como array tipado.
   * No verifica firma (eso es trabajo del backend); solo lee el payload.
   */
  private parseRolesFromJwt(token: string): UsuarioRolCompeticionResumen[] {
    try {
      const payload = token.split('.')[1];
      // base64url → base64 → string. atob no soporta UTF-8, así que lo
      // pasamos por TextDecoder por si algún nombre lleva acentos.
      const json = decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      const claims = JSON.parse(json) as { competiciones?: { id: number; nombre: string; rol: string }[] };
      return (claims.competiciones ?? []).map((c) => ({
        id: c.id,
        nombre: c.nombre,
        rol: c.rol as RolCompeticion,
      }));
    } catch {
      return [];
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  private getStoredUser(): Usuario | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }
}
