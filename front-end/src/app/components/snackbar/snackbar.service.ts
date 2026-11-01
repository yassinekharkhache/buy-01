import { Injectable, signal } from '@angular/core';

export type SnackbarType = 'success' | 'error' | 'info';

export interface SnackbarConfig {
  message: string;
  type?: SnackbarType;
  /** Milliseconds. Use 0 to keep it open until dismissed. */
  duration?: number;
  actionLabel?: string;
  action?: () => void;
}

export interface SnackbarItem {
  id: number;
  message: string;
  type: SnackbarType;
  duration: number;
  actionLabel?: string;
  action?: () => void;
}

const MAX_VISIBLE = 3;

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  private readonly _items = signal<SnackbarItem[]>([]);
  readonly items = this._items.asReadonly();

  show(config: SnackbarConfig): number {
    const type = config.type ?? 'info';
    const item: SnackbarItem = {
      id: ++this.nextId,
      message: config.message,
      type,
      duration: config.duration ?? (type === 'error' ? 6000 : 4000),
      actionLabel: config.actionLabel,
      action: config.action,
    };

    this._items.update((list) => [...list, item].slice(-MAX_VISIBLE));

    if (item.duration > 0) {
      this.timers.set(
        item.id,
        setTimeout(() => this.dismiss(item.id), item.duration),
      );
    }
    return item.id;
  }

  success(message: string, options: Omit<SnackbarConfig, 'message' | 'type'> = {}): number {
    return this.show({ ...options, message, type: 'success' });
  }

  error(message: string, options: Omit<SnackbarConfig, 'message' | 'type'> = {}): number {
    return this.show({ ...options, message, type: 'error' });
  }

  info(message: string, options: Omit<SnackbarConfig, 'message' | 'type'> = {}): number {
    return this.show({ ...options, message, type: 'info' });
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this._items.update((list) => list.filter((item) => item.id !== id));
  }

  runAction(item: SnackbarItem): void {
    item.action?.();
    this.dismiss(item.id);
  }
}