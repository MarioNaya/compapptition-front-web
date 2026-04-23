import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest {
  readonly title: string;
  readonly message?: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly destructive?: boolean;
}

interface ActiveConfirm extends ConfirmRequest {
  readonly resolve: (ok: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly _active = signal<ActiveConfirm | null>(null);
  readonly active = this._active.asReadonly();

  ask(req: ConfirmRequest): Promise<boolean> {
    return new Promise((resolve) => {
      this._active.set({ ...req, resolve });
    });
  }

  respond(ok: boolean): void {
    const a = this._active();
    if (!a) return;
    this._active.set(null);
    a.resolve(ok);
  }
}
