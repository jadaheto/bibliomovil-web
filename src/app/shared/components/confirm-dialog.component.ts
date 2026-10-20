import { Component, inject } from '@angular/core';
import { ConfirmService } from './confirm.service';
import { ModalComponent } from './modal.component';

@Component({
  selector: 'app-confirm-dialog',
  imports: [ModalComponent],
  template: `
    @if (confirm.pending(); as p) {
      <app-modal [abierto]="true" [titulo]="p.titulo" (cerrar)="confirm.answer(false)">
        <p class="mb-0">{{ p.mensaje }}</p>
        <div modal-footer class="modal-footer">
          <button type="button" class="btn btn-light" (click)="confirm.answer(false)">{{ p.textoCancelar }}</button>
          <button type="button" class="btn" [class.btn-danger]="p.peligro" [class.btn-primary]="!p.peligro" (click)="confirm.answer(true)">
            {{ p.textoAceptar }}
          </button>
        </div>
      </app-modal>
    }
  `,
})
export class ConfirmDialogComponent {
  readonly confirm = inject(ConfirmService);
}
