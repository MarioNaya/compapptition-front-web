/**
 * Error normalizado por `errorInterceptor`.
 * NO es un HttpErrorResponse — ha sido transformado antes de llegar al caller.
 */
export interface ApiError {
  readonly status: number;
  readonly message: string;
  readonly errors?: Record<string, string[]>;
}
