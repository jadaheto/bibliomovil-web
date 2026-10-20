import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { LibroDetalle, LibrosService, etiquetaCatalogo } from './libros.service';

export interface Diapositiva {
  url: string;
  principal: boolean;
}

/** Portada primero (marcada como principal) y luego la galería. */
export function diapositivasDe(libro: Pick<LibroDetalle, 'urlPortada' | 'imagenes'> | null): Diapositiva[] {
  if (!libro) return [];
  const lista: Diapositiva[] = [];
  if (libro.urlPortada) lista.push({ url: libro.urlPortada, principal: true });
  for (const img of libro.imagenes) lista.push({ url: img.url, principal: false });
  return lista;
}

/** Detalle de un libro con carrusel de imágenes. */
@Component({
  selector: 'app-libro-detail',
  imports: [DatePipe, RouterLink, PageTitleComponent, LoadingComponent],
  styles: `
    .carrusel { position: relative; background: #0e1e38; border-radius: 12px; overflow: hidden; }
    .carrusel img { width: 100%; height: 360px; object-fit: contain; display: block; }
    .carrusel-btn { position: absolute; top: 50%; transform: translateY(-50%); border: 0; background: rgba(255, 255, 255, 0.85); width: 40px; height: 40px; border-radius: 50%; }
    .carrusel-btn.prev { left: 10px; }
    .carrusel-btn.next { right: 10px; }
    .carrusel-contador { position: absolute; bottom: 10px; right: 12px; background: rgba(0, 0, 0, 0.6); color: #fff; padding: 2px 10px; border-radius: 999px; font-size: 12px; }
    .carrusel-indicadores { display: flex; gap: 6px; justify-content: center; margin-top: 10px; }
    .carrusel-indicadores button { width: 10px; height: 10px; border-radius: 50%; border: 0; background: #cfd6e4; padding: 0; }
    .carrusel-indicadores button.activo { background: var(--bs-primary, #5c59e8); }
  `,
  template: `
    <app-page-title titulo="Detalle del Libro">
      @if (auth.hasRole('administrador') && libro()) {
        <a [routerLink]="['/libros', libro()!.id, 'editar']" class="btn btn-primary btn-sm"><i class="ri-edit-line me-1"></i>Editar</a>
      }
      <a routerLink="/libros" class="btn btn-secondary btn-sm"><i class="ri-arrow-left-line me-1"></i>Volver</a>
    </app-page-title>

    @if (!libro()) {
      <app-loading />
    } @else if (libro(); as l) {
      <div class="row g-4">
        <div class="col-lg-7">
          <div class="card h-100">
            <div class="card-header"><h5 class="card-title">Información del Libro</h5></div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-sm align-middle mb-0">
                  <tbody>
                    <tr><th class="w-40 text-muted">ID</th><td>{{ l.id }}</td></tr>
                    <tr><th class="text-muted">ISBN</th><td>{{ l.isbn }}</td></tr>
                    <tr><th class="text-muted">Título</th><td class="fw-semibold">{{ l.titulo }}</td></tr>
                    <tr><th class="text-muted">Autor</th><td>{{ l.autor }}</td></tr>
                    <tr><th class="text-muted">Editorial</th><td>{{ l.editorial || '—' }}</td></tr>
                    <tr><th class="text-muted">Año Publicación</th><td>{{ l.anioPublicacion ?? '—' }}</td></tr>
                    <tr><th class="text-muted">Categoría</th><td>{{ l.categoria }}</td></tr>
                    <tr><th class="text-muted">Idioma</th><td>{{ etiqueta(l.idioma) }}</td></tr>
                    <tr><th class="text-muted">Cantidad</th><td>{{ l.cantidad }}</td></tr>
                    <tr><th class="text-muted">Número Páginas</th><td>{{ l.numeroPaginas ?? '—' }}</td></tr>
                    <tr><th class="text-muted">Estado Conservación</th><td>{{ etiqueta(l.estadoConservacion) }}</td></tr>
                    <tr>
                      <th class="text-muted">Disponible</th>
                      <td><span class="badge" [class]="l.disponible ? 'bg-success' : 'bg-danger'">{{ l.disponible ? 'Sí' : 'No' }}</span></td>
                    </tr>
                    <tr><th class="text-muted">Ubicación Estante</th><td>{{ l.ubicacionEstante || '—' }}</td></tr>
                    <tr><th class="text-muted">Código interno</th><td>{{ l.codigoBarras || '—' }}</td></tr>
                    <tr><th class="text-muted">Observaciones</th><td>{{ l.observaciones || '—' }}</td></tr>
                    <tr>
                      <th class="text-muted">Activo</th>
                      <td><span class="badge" [class]="l.activo ? 'bg-success' : 'bg-secondary'">{{ l.activo ? 'Sí' : 'No' }}</span></td>
                    </tr>
                    <tr><th class="text-muted">Creado</th><td>{{ l.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td></tr>
                    <tr><th class="text-muted">Actualizado</th><td>{{ l.updatedAt | date: 'dd/MM/yyyy HH:mm' }}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">Imágenes del Libro</h5>
              <span class="badge bg-light-purple text-primary">{{ diapositivas().length }}</span>
            </div>
            <div class="card-body">
              @if (diapositivas().length === 0) {
                <div class="text-center text-muted py-5"><i class="ri-image-line fs-2 d-block mb-2"></i>Este libro no tiene imágenes registradas.</div>
              } @else if (actual(); as d) {
                <div class="carrusel">
                  <img [src]="d.url" alt="Imagen del libro" />
                  @if (d.principal) { <span class="badge bg-primary position-absolute top-0 start-0 m-2">Principal</span> }
                  @if (diapositivas().length > 1) {
                    <button type="button" class="carrusel-btn prev" aria-label="Anterior" (click)="anterior()"><i class="ri-arrow-left-s-line fs-4"></i></button>
                    <button type="button" class="carrusel-btn next" aria-label="Siguiente" (click)="siguiente()"><i class="ri-arrow-right-s-line fs-4"></i></button>
                  }
                  <span class="carrusel-contador">{{ indice() + 1 }} / {{ diapositivas().length }}</span>
                </div>
                @if (diapositivas().length > 1) {
                  <div class="carrusel-indicadores">
                    @for (s of diapositivas(); track $index) {
                      <button type="button" [class.activo]="$index === indice()" [attr.aria-label]="'Imagen ' + ($index + 1)" (click)="indice.set($index)"></button>
                    }
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class LibroDetailComponent {
  readonly auth = inject(AuthService);
  private readonly service = inject(LibrosService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  readonly libro = signal<LibroDetalle | null>(null);
  readonly indice = signal(0);
  readonly diapositivas = computed(() => diapositivasDe(this.libro()));
  readonly actual = computed(() => this.diapositivas()[this.indice()] ?? null);
  readonly etiqueta = etiquetaCatalogo;

  ngOnInit(): void {
    this.service.obtener(this.id()).subscribe({
      next: (l) => this.libro.set(l),
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message || 'Libro no encontrado.');
        void this.router.navigate(['/libros']);
      },
    });
  }

  anterior(): void {
    const n = this.diapositivas().length;
    if (n) this.indice.update((i) => (i - 1 + n) % n);
  }

  siguiente(): void {
    const n = this.diapositivas().length;
    if (n) this.indice.update((i) => (i + 1) % n);
  }
}
