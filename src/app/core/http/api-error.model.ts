/**
 * Error normalizado por `errorInterceptor`.
 * NO es un HttpErrorResponse — ha sido transformado antes de llegar al caller.
 *
 * `errors` mapea nombre de campo → mensaje, tal como lo envía el backend en
 * `ErrorResponse.validationErrors` (Bean Validation: @Size, @Pattern, @Email, etc.).
 */
export interface ApiError {
  readonly status: number;
  readonly message: string;
  readonly errors?: Record<string, string>;
}
