import { Component, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

/** Encabezado de página: `<h4>` + zona de botones a la derecha (patrón del sistema original). */
@Component({
  selector: 'app-page-title',
  template: `
    <div class="row mb-4">
      <div class="col-lg-12">
        <div class="page-title-box d-sm-flex align-items-center justify-content-between gap-2">
          <h4 class="mb-sm-0">{{ titulo() }}</h4>
          <div class="page-title-right d-flex gap-2 flex-wrap"><ng-content /></div>
        </div>
      </div>
    </div>
  `,
})
export class PageTitleComponent {
  private readonly title = inject(Title);
  readonly titulo = input.required<string>();
  /** Título del documento (pestaña); por defecto el mismo título. */
  readonly documento = input<string>();

  ngOnInit(): void {
    this.title.setTitle(`${this.documento() ?? this.titulo()} - ${environment.appName}`);
  }
}
