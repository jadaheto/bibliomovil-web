import { Component, input } from '@angular/core';

/** Fila/bloque vacío para tablas y listados. */
@Component({
  selector: 'app-empty-state',
  template: `
    <div class="text-center text-muted py-4">
      <i class="ri-inbox-line fs-2 d-block mb-2"></i>
      {{ texto() }}
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  readonly texto = input('No hay registros.');
}
