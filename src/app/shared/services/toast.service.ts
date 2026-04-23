import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly variant: ToastVariant;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<readonly Toast[]>([]);
  private nextId = 1;

  readonly toasts = this._toasts.asReadonly();

  success(message: string, durationMs = 3500): void {
    this.push(message, 'success', durationMs);
  }

  error(message: string, durationMs = 5000): void {
    this.push(message, 'error', durationMs);
  }

  info(message: string, durationMs = 3500): void {
    this.push(message, 'info', durationMs);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(message: string, variant: ToastVariant, durationMs: number): void {
    const toast: Toast = { id: this.nextId++, message, variant };
    this._toasts.update((list) => [...list, toast]);
    if (durationMs > 0) {
      setTimeout(() => this.dismiss(toast.id), durationMs);
    }
  }
}
