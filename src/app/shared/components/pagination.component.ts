import { Component, computed, input, output } from '@angular/core';

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginatedMeta;
}

@Component({
  selector: 'app-pagination',
  template: `
    @if (meta(); as m) {
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-3">
        <small class="text-muted">
          Mostrando {{ desde() }}–{{ hasta() }} de {{ m.total }} registro{{ m.total === 1 ? '' : 's' }}
        </small>
        @if (m.totalPages > 1) {
          <nav aria-label="Paginación">
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" [class.disabled]="m.page <= 1">
                <button class="page-link" (click)="cambiar.emit(m.page - 1)" [disabled]="m.page <= 1">Anterior</button>
              </li>
              @for (p of paginas(); track p) {
                <li class="page-item" [class.active]="p === m.page">
                  <button class="page-link" (click)="cambiar.emit(p)">{{ p }}</button>
                </li>
              }
              <li class="page-item" [class.disabled]="m.page >= m.totalPages">
                <button class="page-link" (click)="cambiar.emit(m.page + 1)" [disabled]="m.page >= m.totalPages">Siguiente</button>
              </li>
            </ul>
          </nav>
        }
      </div>
    }
  `,
})
export class PaginationComponent {
  readonly meta = input<PaginatedMeta | null>(null);
  readonly cambiar = output<number>();

  readonly desde = computed(() => {
    const m = this.meta();
    return !m || m.total === 0 ? 0 : (m.page - 1) * m.limit + 1;
  });
  readonly hasta = computed(() => {
    const m = this.meta();
    return !m ? 0 : Math.min(m.total, m.page * m.limit);
  });
  readonly paginas = computed(() => {
    const m = this.meta();
    if (!m) return [];
    const start = Math.max(1, m.page - 2);
    const end = Math.min(m.totalPages, start + 4);
    const pages: number[] = [];
    for (let p = Math.max(1, end - 4); p <= end; p++) pages.push(p);
    return pages;
  });
}
