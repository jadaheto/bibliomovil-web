import { Component, input, output } from '@angular/core';

/**
 * Modal Bootstrap controlado por Angular (sin el JS de Bootstrap).
 * Uso: `<app-modal [abierto]="mostrar()" titulo="..." (cerrar)="mostrar.set(false)">contenido</app-modal>`
 */
@Component({
  selector: 'app-modal',
  template: `
    @if (abierto()) {
      <div class="modal-backdrop-custom" (click)="cerrar.emit()"></div>
      <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
        <div class="modal-dialog modal-dialog-centered" [class.modal-lg]="tamano() === 'lg'" [class.modal-xl]="tamano() === 'xl'">
          <div class="modal-content" style="border-radius: 16px">
            <div class="modal-header">
              <h5 class="modal-title fw-bold">{{ titulo() }}</h5>
              <button type="button" class="btn-close" aria-label="Cerrar" (click)="cerrar.emit()"></button>
            </div>
            <div class="modal-body"><ng-content /></div>
            <ng-content select="[modal-footer]" />
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  readonly abierto = input(false);
  readonly titulo = input('');
  readonly tamano = input<'md' | 'lg' | 'xl'>('md');
  readonly cerrar = output<void>();
}
