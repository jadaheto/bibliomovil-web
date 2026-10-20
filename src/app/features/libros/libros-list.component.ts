import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { AlertService } from '../../core/ui/alert.service';
import { ConfirmService } from '../../shared/components/confirm.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { PaginatedMeta, PaginationComponent } from '../../shared/components/pagination.component';
import { Libro, LibrosService, etiquetaCatalogo } from './libros.service';

/** Catálogo de libros (todos los roles); el administrador gestiona y la institución solicita préstamos. */
@Component({
  selector: 'app-libros-list',
  imports: [FormsModule, RouterLink, PageTitleComponent, LoadingComponent, PaginationComponent],
  template: `
    <app-page-title titulo="Catálogo de Libros">
      @if (auth.hasRole('administrador')) {
        <a routerLink="/libros/nuevo" class="btn btn-primary btn-sm"><i class="ri-add-line me-1"></i>Nuevo Libro</a>
      }
      @if (auth.hasRole('institucion')) {
        <a routerLink="/prestamos" class="btn btn-secondary btn-sm"><i class="ri-arrow-left-line me-1"></i>Volver</a>
      }
    </app-page-title>

    <div class="card">
      <div class="card-header"><h5 class="card-title">Catálogo de Libros</h5></div>
      <div class="card-body">
        <form class="row g-2 align-items-center mb-3" (submit)="buscar($event)">
          <div class="col-md-7">
            <div class="input-group">
              <span class="input-group-text"><i class="ri-search-line"></i></span>
              <input type="search" class="form-control" [(ngModel)]="q" name="q" placeholder="Buscar por titulo, autor, ISBN, categoria o editorial..." />
              @if (q) {
                <button type="button" class="btn btn-outline-secondary" (click)="limpiar()" aria-label="Limpiar"><i class="ri-close-line"></i></button>
              }
              <button type="submit" class="btn btn-primary">Buscar</button>
            </div>
          </div>
          <div class="col-md-5 text-md-end">
            @if (meta(); as m) { <span class="badge bg-light-purple text-primary">{{ m.total }} libro(s)</span> }
          </div>
        </form>

        @if (cargando()) {
          <app-loading />
        } @else {
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>ID</th><th>ISBN</th><th>Título</th><th>Autor</th><th>Editorial</th><th>Año</th><th>Categoría</th>
                  <th>Idioma</th><th>Cantidad</th><th>Estado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (l of items(); track l.id) {
                  <tr>
                    <td>{{ l.id }}</td>
                    <td>{{ l.isbn }}</td>
                    <td class="fw-semibold">{{ l.titulo }}</td>
                    <td>{{ l.autor }}</td>
                    <td>{{ l.editorial || '—' }}</td>
                    <td>{{ l.anioPublicacion ?? '—' }}</td>
                    <td>{{ l.categoria }}</td>
                    <td>{{ etiqueta(l.idioma) }}</td>
                    <td>{{ l.cantidad }}</td>
                    <td>
                      <span class="badge" [class]="l.disponibleParaPrestamo ? 'bg-success' : 'bg-danger'">
                        {{ l.disponibleParaPrestamo ? 'Disponible' : 'No disponible' }}
                      </span>
                    </td>
                    <td class="text-nowrap">
                      <div class="d-flex gap-1">
                        <a [routerLink]="['/libros', l.id]" class="btn btn-outline-primary btn-sm"><i class="ri-eye-line"></i> Ver</a>
                        @if (auth.hasRole('administrador')) {
                          <a [routerLink]="['/libros', l.id, 'editar']" class="btn btn-outline-secondary btn-sm"><i class="ri-edit-line"></i> Editar</a>
                          <button type="button" class="btn btn-outline-danger btn-sm" (click)="eliminar(l)"><i class="ri-delete-bin-line"></i> Eliminar</button>
                        }
                        @if (auth.hasRole('institucion')) {
                          <a routerLink="/prestamos/solicitar" [queryParams]="{ libroId: l.id }" class="btn btn-success btn-sm" [class.disabled]="!l.disponibleParaPrestamo">
                            <i class="ri-shopping-cart-line"></i> Solicitar
                          </a>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="11" class="text-center text-muted py-4">
                      {{ q ? 'No se encontraron libros con ese criterio.' : 'No hay libros registrados.' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination [meta]="meta()" (cambiar)="cargar($event)" />
        }
      </div>
    </div>
  `,
})
export class LibrosListComponent {
  readonly auth = inject(AuthService);
  private readonly service = inject(LibrosService);
  private readonly alerts = inject(AlertService);
  private readonly confirm = inject(ConfirmService);

  readonly items = signal<Libro[]>([]);
  readonly meta = signal<PaginatedMeta | null>(null);
  readonly cargando = signal(true);
  readonly etiqueta = etiquetaCatalogo;
  q = '';

  constructor() {
    this.cargar(1);
  }

  cargar(page: number): void {
    this.cargando.set(true);
    this.service.listar(this.q, page).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.meta.set(res.meta);
        this.cargando.set(false);
      },
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message);
        this.cargando.set(false);
      },
    });
  }

  buscar(event: Event): void {
    event.preventDefault();
    this.cargar(1);
  }

  limpiar(): void {
    this.q = '';
    this.cargar(1);
  }

  async eliminar(libro: Libro): Promise<void> {
    const ok = await this.confirm.ask({ titulo: 'Eliminar libro', mensaje: '¿Eliminar este libro?', textoAceptar: 'Eliminar', peligro: true });
    if (!ok) return;
    this.service.eliminar(libro.id).subscribe({
      next: () => {
        this.alerts.success('Libro eliminado exitosamente.');
        this.cargar(this.meta()?.page ?? 1);
      },
      error: (err: ApiRequestError) => this.alerts.error(err.message || 'Error al eliminar el libro.'),
    });
  }
}
