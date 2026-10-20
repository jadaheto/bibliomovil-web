import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { esInvalido, mensajeError } from '../forms/form.utils';

/** Muestra el mensaje de validación de un control cuando es inválido y fue tocado. */
@Component({
  selector: 'app-field-error',
  template: `
    @if (visible) {
      <div class="invalid-feedback d-block">{{ mensaje }}</div>
    }
  `,
})
export class FieldErrorComponent {
  readonly control = input<AbstractControl | null>(null);
  readonly etiqueta = input('Este campo');

  // Getters (no signals): el estado de un FormControl no es reactivo, se evalúa en cada detección de cambios.
  get visible(): boolean {
    return esInvalido(this.control());
  }
  get mensaje(): string {
    return mensajeError(this.control(), this.etiqueta());
  }
}
