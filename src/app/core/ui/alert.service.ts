import { Injectable, signal } from '@angular/core';

export type AlertType = 'success' | 'danger' | 'warning' | 'info';

export interface AlertMessage {
  id: number;
  type: AlertType;
  text: string;
}

/**
 * Mensajes "flash" equivalentes a `set_flashdata('success'|'error')` del sistema
 * original. Se pintan como alertas Bootstrap en la parte superior del contenido
 * y sobreviven a una navegación (se limpian en la siguiente).
 */
@Injectable({ providedIn: 'root' })
export class AlertService {
  private seq = 0;
  readonly messages = signal<AlertMessage[]>([]);
  private keepOnce = false;

  success(text: string): void { this.push('success', text); }
  error(text: string): void { this.push('danger', text); }
  warning(text: string): void { this.push('warning', text); }
  info(text: string): void { this.push('info', text); }

  dismiss(id: number): void {
    this.messages.update((list) => list.filter((m) => m.id !== id));
  }

  clear(): void {
    this.messages.set([]);
  }

  /** Llamado por el layout en cada navegación: conserva el mensaje recién creado una vez. */
  onNavigation(): void {
    if (this.keepOnce) {
      this.keepOnce = false;
      return;
    }
    this.clear();
  }

  private push(type: AlertType, text: string): void {
    const id = ++this.seq;
    this.messages.update((list) => [...list.filter((m) => m.text !== text), { id, type, text }]);
    this.keepOnce = true;
    if (type === 'success' || type === 'info') {
      setTimeout(() => this.dismiss(id), 6000);
    }
  }
}
