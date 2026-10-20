import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { PaginatedMeta, PaginationComponent } from '../../shared/components/pagination.component';
import { AccionPrestamo, ESTADOS_PRESTAMO, Prestamo, PrestamosService, badgePrestamoAdmin, opcionesEstadoPrestamo } from './prestamos.service';

/** Consulta de todos los préstamos (administrador) con cambio de estado en línea. */
@Component({
  selector: 'app-prestamos-admin',
  imports: [FormsModule, DatePipe, RouterLink, PageTitleComponent, LoadingComponent, PaginationComponent],
  template: `
    <app-page-title titulo="Consulta de Préstamos">
      <a routerLink="/libros" class="btn btn-secondary btn-sm"><i class="ri-arrow-left-line me-1"></i>Volver</a>
    </app-page-title>

    <div class="card">
      <div class="card-header"><h5 class="card-title">Todos los Préstamos</h5></div>
      <div class="card-body">
        <form class="row g-2 align-items-center mb-3" (submit)="buscar($event)">
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="estado" name="estado" (ngModelChange)="cargar(1)">
              <option value="">Todos los estados</option>
              @for (e of estados; track e) { <option [value]="e">{{ e }}</option> }
            </select>
          </div>
          <div class="col-md-6">
            <div class="input-group">
              <input type="search" class="form-control" [(ngModel)]="q" name="q" placeholder="Buscar por libro, solicitante o institución..." />
              @if (q) {
                <button type="button" class="btn btn-outline-secondary" (click)="limpiar()" aria-label="Limpiar"><i class="ri-close-line"></i></button>
              }
              <button type="submit" class="btn btn-primary"><i class="ri-search-line me-1"></i>Buscar</button>
            </div>
          </div>
          <div class="col-md-3 text-md-end">
            @if (meta(); as m) { <span class="badge bg-light-purple text-primary">{{ m.total }} préstamo(s)</span> }
          </div>
        </form>

        @if (cargando()) {
          <app-loading />
        } @else {
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>ID</th><th>Libro</th><th>Solicitante</th><th>Institución</th><th>Fecha Préstamo</th><th>Fecha Devolución</th><th>Estado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (p of items(); track p.id) {
                  <tr>
                    <td>{{ p.id }}</td>
                    <td class="fw-semibold">{{ p.libroTitulo || 'N/A' }}</td>
                    <td>
                      {{ p.personaNombre }}
                      @if (p.personaId) { <small class="text-muted d-block">{{ p.personaId }}</small> }
                    </td>
                    <td>{{ p.institucionNombre || 'N/A' }}</td>
                    <td>{{ p.fechaPrestamo | date: 'dd/MM/yyyy' }}</td>
                    <td>
                      @if (p.fechaDevolucion) { {{ p.fechaDevolucion | date: 'dd/MM/yyyy' }} } @else { <span class="text-muted">Pendiente</span> }
                    </td>
                    <td>
                      <span class="badge" [class]="badge(p).clase">{{ badge(p).texto }}</span>
                      @if (p.vencido) { <small class="text-danger d-block">Vencido</small> }
                    </td>
                    <td>
                      <form class="d-flex gap-1 align-items-center" (submit)="actualizar($event, p)">
                        <select class="form-select form-select-sm" style="width: auto" [ngModel]="seleccion()[p.id] ?? ''" (ngModelChange)="seleccionar(p.id, $event)" [name]="'accion' + p.id" required>
                          @if (opciones(p.estado).placeholder; as ph) { <option value="">{{ ph }}</option> }
                          @for (o of opciones(p.estado).opciones; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
                        </select>
                        <button type="submit" class="btn btn-primary btn-sm" [disabled]="procesando() === p.id || !seleccion()[p.id]">
                          @if (procesando() === p.id) { <span class="spinner-border spinner-border-sm"></span> } @else { Actualizar }
                        </button>
                        <a [routerLink]="['/prestamos', p.id]" class="btn btn-outline-primary btn-sm" title="Ver detalle"><i class="ri-eye-line"></i></a>
                      </form>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="8" class="text-center text-muted py-4">No hay préstamos registrados</td></tr>
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
export class PrestamosAdminComponent {
  private readonly service = inject(PrestamosService);
  private readonly alerts = inject(AlertService);

  readonly estados = ESTADOS_PRESTAMO;
  readonly items = signal<Prestamo[]>([]);
  readonly meta = signal<PaginatedMeta | null>(null);
  readonly cargando = signal(true);
  readonly procesando = signal<number | null>(null);
  /** Acción elegida en el selector de cada fila. */
  readonly seleccion = signal<Partial<Record<number, AccionPrestamo | ''>>>({});
  readonly badge = badgePrestamoAdmin;
  readonly opciones = opcionesEstadoPrestamo;
  estado = '';
  q = '';

  constructor() {
    this.cargar(1);
  }

  cargar(page: number): void {
    this.cargando.set(true);
    this.service.admin({ estado: this.estado, q: this.q }, page).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.meta.set(res.meta);
        this.seleccion.set(Object.fromEntries(res.items.map((p) => [p.id, this.seleccionInicial(p.estado)])));
        this.cargando.set(false);
      },
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message);
        this.cargando.set(false);
      },
    });
  }

  /** Sin placeholder, la primera opción queda preseleccionada (como en el `<select>` original). */
  private seleccionInicial(estado: string): AccionPrestamo | '' {
    const { placeholder, opciones } = opcionesEstadoPrestamo(estado);
    return placeholder ? '' : opciones[0].value;
  }

  seleccionar(id: number, accion: AccionPrestamo | ''): void {
    this.seleccion.update((s) => ({ ...s, [id]: accion }));
  }

  buscar(event: Event): void {
    event.preventDefault();
    this.cargar(1);
  }

  limpiar(): void {
    this.q = '';
    this.cargar(1);
  }

  actualizar(event: Event, p: Prestamo): void {
    event.preventDefault();
    const accion = this.seleccion()[p.id];
    if (!accion) {
      this.alerts.error('Estado de préstamo no válido.');
      return;
    }
    this.procesando.set(p.id);
    this.service.cambiarEstado(p.id, accion).subscribe({
      next: () => {
        this.alerts.success(accion === 'libros_entregados' ? 'Estado actualizado a libros entregados.' : 'Préstamo actualizado como devuelto.');
        this.procesando.set(null);
        this.cargar(this.meta()?.page ?? 1);
      },
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message);
        this.procesando.set(null);
      },
    });
  }
}
