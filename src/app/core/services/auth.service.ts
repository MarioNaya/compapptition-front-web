import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, Injector, signal } from '@angular/core';
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

interface JwtClaims {
  readonly sub?: string;
  readonly userId?: number;
  readonly esAdminSistema?: boolean;
  readonly exp?: number;
  readonly competiciones?: ReadonlyArray<{ id: number; nombre: string; rol: string }>;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  // Injector para resolver de forma perezosa los services con estado a
  // resetear en logout (NotificationService, MensajeriaService,
  // InvitacionService) sin generar dependencia circular ni cargarlos antes
  // de tiempo (cierra SF-5 / SF-7 sin acoplar AuthService a features).
  private readonly injector = inject(Injector);

  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly USUARIOS_URL = `${environment.apiUrl}/usuarios`;
  private readonly TOKEN_KEY = 'access_token';

  /**
   * Estado del usuario autenticado. Se inicializa de forma síncrona desde
   * los claims del JWT (si hay token persistido) para evitar el flash de
   * "no autenticado" durante el bootstrap; en el constructor se hidrata con
   * los datos canónicos de {@code GET /usuarios/me} (cierra SF-2).
   */
  private currentUserSignal = signal<Usuario | null>(this.bootstrapUserFromToken());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());

  constructor() {
    if (this.getToken()) {
      this.loadCurrentUser().subscribe({
        error: () => this.clearSession(),
      });
    }

    // Sincronización multi-pestaña (cierra SF-12): si en otra pestaña se hace
    // logout (TOKEN_KEY desaparece) o login con cuenta distinta (TOKEN_KEY
    // cambia), reflejamos el estado aquí. window/storage events solo se
    // disparan en pestañas DISTINTAS de la que escribió la clave.
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key !== this.TOKEN_KEY) return;
        if (event.newValue === null) {
          // Otra pestaña hizo logout. Limpiamos también aquí.
          if (this.currentUserSignal() !== null) {
            this.clearSession();
          }
        } else if (event.newValue !== event.oldValue) {
          // Otra pestaña cambió la sesión (login con cuenta distinta).
          // Recargamos el currentUser desde /usuarios/me con el nuevo token.
          this.loadCurrentUser().subscribe({
            error: () => this.clearSession(),
          });
        }
      });
    }
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, request, { withCredentials: true })
      .pipe(
        tap((response) => this.handleAuthResponse(response)),
        catchError((error) => throwError(() => error)),
      );
  }

  registro(request: RegistroRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/registro`, request, { withCredentials: true })
      .pipe(
        tap((response) => this.handleAuthResponse(response)),
        catchError((error) => throwError(() => error)),
      );
  }

  /**
   * Renueva el access token. El refresh token vive en una cookie HttpOnly
   * gestionada por el backend; el cliente solo necesita enviar la petición
   * con {@code withCredentials: true} (cierra SF-4 y S-17).
   */
  refreshToken(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((response) => this.handleAuthResponse(response)),
        catchError((error) => throwError(() => error)),
      );
  }

  logout(): void {
    // Garantiza la limpieza local aunque el POST al backend falle (401, 500,
    // timeout, sin red): finalize se dispara tanto en next como en error.
    this.http
      .post(`${this.API_URL}/logout`, {}, { withCredentials: true })
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

  /**
   * Limpia el estado local de la sesión. Usado por el refresh interceptor
   * cuando el refresh falla (no podemos llamar a logout porque el backend
   * ya rechazó el token), y por bootstrap si {@code /usuarios/me} devuelve
   * 401 al arrancar. No emite HTTP — la cookie se limpia en logout(),
   * aquí solo borramos el estado cliente y redirigimos.
   *
   * Re-entrante seguro: si se invoca dos veces en cascada (p. ej. bootstrap
   * con token y cookie ambos caducados, donde el refresh interceptor llama a
   * clearSession y el subscribe del constructor también lo intenta), la
   * segunda llamada se ignora para evitar doble navigate y futuros side-effects
   * múltiples si se añade lógica de reset (cierra SF-23).
   */
  clearSession(): void {
    if (this.clearSessionInProgress) return;
    this.clearSessionInProgress = true;
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSignal.set(null);
    this.resetFeatureServices();
    this.router.navigate(['/auth/login'], { replaceUrl: true })
      .finally(() => { this.clearSessionInProgress = false; });
  }

  /**
   * Resetea el estado en memoria de los services con datos de sesión y cierra
   * recursos abiertos (SSE) para que la sesión saliente no contamine la
   * entrante (cierra SF-5 y SF-7). Resolución perezosa vía {@link Injector}
   * para evitar dependencia circular con AuthService.
   *
   * Se hace late-bind sin tipar las clases para evitar acoplar este core
   * service a feature modules; cada service expone un método público
   * {@code reset(): void} (contrato).
   */
  private resetFeatureServices(): void {
    const tryReset = (token: unknown) => {
      try {
        const svc = this.injector.get(token as never, null) as { reset?: () => void } | null;
        svc?.reset?.();
      } catch {
        // ignore: service no registrado en este momento (test, lazy chunk no cargado).
      }
    };
    // Imports dinámicos para no acoplar AuthService a features. Los tokens
    // se resuelven solo si están en el injector tree.
    import('./notification.service').then(m => tryReset(m.NotificationService));
    import('@features/messages/services/mensajeria.service').then(m => tryReset(m.MensajeriaService));
    import('@features/invitations/services/invitacion.service').then(m => tryReset(m.InvitacionService));
  }

  private clearSessionInProgress = false;

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

  // -------------------------------------------------------------------------
  // Privados
  // -------------------------------------------------------------------------

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    const enriched: Usuario = {
      ...response.usuario,
      rolesCompeticion: this.parseRolesFromJwt(response.accessToken),
    };
    this.currentUserSignal.set(enriched);
  }

  /**
   * Hidrata {@code currentUser} con los datos canónicos del backend a partir
   * del token actual. Se llama en el constructor (rehidratación tras refresh
   * de página) y al recibirse un 401 manejado por el refresh interceptor.
   */
  private loadCurrentUser(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.USUARIOS_URL}/me`).pipe(
      tap((user) => {
        const token = this.getToken();
        const enriched: Usuario = {
          ...user,
          rolesCompeticion: token ? this.parseRolesFromJwt(token) : [],
        };
        this.currentUserSignal.set(enriched);
      }),
    );
  }

  /**
   * Construye un {@link Usuario} provisional desde los claims del JWT para
   * evitar el flash "no autenticado" durante el bootstrap. Solo expone
   * username, id, esAdminSistema y rolesCompeticion: el resto (email,
   * nombre, apellidos) se completa cuando llega {@code GET /usuarios/me}.
   */
  private bootstrapUserFromToken(): Usuario | null {
    const token = this.getTokenSafe();
    if (!token) return null;
    const claims = this.decodeJwtClaims(token);
    if (!claims?.userId) return null;
    // Si el JWT está caducado no hidratamos: dejamos que el flujo del
    // refresh interceptor (disparado por la primera petición que falle)
    // decida si recuperar la sesión o forzar login. Cierra SF-22 (ventana
    // visual de "sesión fantasma" tras token caducado en localStorage).
    if (claims.exp && claims.exp * 1000 < Date.now()) {
      return null;
    }
    return {
      id: claims.userId,
      username: claims.sub ?? '',
      email: '',
      activo: true,
      esAdminSistema: !!claims.esAdminSistema,
      rolesCompeticion: this.mapRoles(claims.competiciones),
    };
  }

  /**
   * Lectura defensiva de localStorage para entornos donde no exista (SSR,
   * Karma sin DOM, etc.). En el navegador real es equivalente a getToken().
   */
  private getTokenSafe(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Decodifica el JWT y devuelve el claim `competiciones` como array tipado.
   * No verifica firma (eso es trabajo del backend); solo lee el payload.
   */
  private parseRolesFromJwt(token: string): UsuarioRolCompeticionResumen[] {
    return this.mapRoles(this.decodeJwtClaims(token)?.competiciones);
  }

  private mapRoles(
    raw: ReadonlyArray<{ id: number; nombre: string; rol: string }> | undefined,
  ): UsuarioRolCompeticionResumen[] {
    return (raw ?? []).map((c) => ({
      id: c.id,
      nombre: c.nombre,
      rol: c.rol as RolCompeticion,
    }));
  }

  private decodeJwtClaims(token: string): JwtClaims | null {
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
      return JSON.parse(json) as JwtClaims;
    } catch {
      return null;
    }
  }
}
