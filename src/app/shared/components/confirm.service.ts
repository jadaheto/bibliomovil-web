import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  titulo?: string;
  mensaje: string;
  textoAceptar?: string;
  textoCancelar?: string;
  peligro?: boolean;
}

interface PendingConfirm extends Required<ConfirmOptions> {
  resolve: (value: boolean) => void;
}

/** Diálogo de confirmación (reemplaza `confirm()` nativo). El layout renderiza el modal. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly pending = signal<PendingConfirm | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.pending.set({
        titulo: options.titulo ?? 'Confirmar',
        mensaje: options.mensaje,
        textoAceptar: options.textoAceptar ?? 'Aceptar',
        textoCancelar: options.textoCancelar ?? 'Cancelar',
        peligro: options.peligro ?? false,
        resolve,
      });
    });
  }

  answer(value: boolean): void {
    const current = this.pending();
    this.pending.set(null);
    current?.resolve(value);
  }
}
