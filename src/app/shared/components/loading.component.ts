import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  template: `
    <div class="spinner-page">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">{{ texto() }}</span>
      </div>
    </div>
  `,
})
export class LoadingComponent {
  readonly texto = input('Cargando...');
}
