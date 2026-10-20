import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { PaginatedMeta, PaginationComponent } from '../../shared/components/pagination.component';
import { Carnet, CarnetsService, ESTADOS_CARNET, EstadoCarnet, badgeCarnet, tipoPersonaLabel } from './carnets.service';

/** Gestión de carnets digitales (administrador): listado global y cambio de estado. */
@Component({
  selector: 'app-carnets-admin',
  imports: [FormsModule, DatePipe, RouterLink, PageTitleComponent, LoadingComponent, PaginationComponent],
  template: `
    <app-page-title titulo="Gestión de Carnets Digitales">
      <a routerLink="/carnets/registro" class="btn btn-primary btn-sm"><i class="ri-add-line me-1"></i>Registrar Carnet</a>
    </app-page-title>

    <div class="card">
      <div class="card-header"><h5 class="card-title">Carnets Registrados</h5></div>
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
              <input type="search" class="form-control" [(ngModel)]="q" name="q" placeholder="Buscar por nombre, identificación o código..." />
              @if (q) {
                <button type="button" class="btn btn-outline-secondary" (click)="limpiar()" aria-label="Limpiar"><i class="ri-close-line"></i></button>
              }
              <button type="submit" class="btn btn-primary"><i class="ri-search-line me-1"></i>Buscar</button>
            </div>
          </div>
          <div class="col-md-3 text-md-end">
            @if (meta(); as m) { <span class="badge bg-light-purple text-primary">{{ m.total }} carnet(s)</span> }
          </div>
        </form>

        @if (cargando()) {
          <app-loading />
        } @else {
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr><th>Tipo</th><th>Nombre</th><th>Identificación</th><th>Institución</th><th>Estado Actual</th><th>Fecha Registro</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                @for (c of items(); track c.id) {
                  <tr>
                    <td><span class="badge" [class]="c.tipoPersona === 'docente' ? 'bg-info' : 'bg-primary'">{{ tipo(c.tipoPersona) }}</span></td>
                    <td class="fw-bold">{{ c.nombres }} {{ c.apellidos }}</td>
                    <td>{{ c.tipoIdentificacion }} - {{ c.numeroIdentificacion }}</td>
                    <td>{{ c.institucionNombre || 'N/A' }}</td>
                    <td><span class="badge" [class]="badge(c.estado).clase">{{ badge(c.estado).texto }}</span></td>
                    <td>{{ c.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                    <td>
                      <form class="d-flex gap-1 align-items-center" (submit)="actualizar($event, c)">
                        <select class="form-select form-select-sm" style="width: auto" [ngModel]="seleccion()[c.id] ?? c.estado" (ngModelChange)="seleccionar(c.id, $event)" [name]="'estado' + c.id">
                          @for (e of estados; track e) { <option [value]="e">{{ e }}</option> }
                        </select>
                        <button type="submit" class="btn btn-primary btn-sm" [disabled]="procesando() === c.id">
                          @if (procesando() === c.id) { <span class="spinner-border spinner-border-sm"></span> } @else { Actualizar }
                        </button>
                        <a [routerLink]="['/carnets', c.id]" class="btn btn-outline-primary btn-sm" title="Ver detalle"><i class="ri-eye-line"></i> Ver</a>
                      </form>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="7" class="text-center text-muted py-4">No hay carnets registrados</td></tr>
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
export class CarnetsAdminComponent {
  private readonly service = inject(CarnetsService);
  private readonly alerts = inject(AlertService);

  readonly estados = ESTADOS_CARNET;
  readonly items = signal<Carnet[]>([]);
  readonly meta = signal<PaginatedMeta | null>(null);
  readonly cargando = signal(true);
  readonly procesando = signal<number | null>(null);
  readonly seleccion = signal<Partial<Record<number, EstadoCarnet>>>({});
  readonly badge = badgeCarnet;
  readonly tipo = tipoPersonaLabel;
  estado = '';
  q = '';

  constructor() {
    this.cargar(1);
  }

  cargar(page: number): void {
    this.cargando.set(true);
    this.service.adminListar({ estado: this.estado, q: this.q }, page).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.meta.set(res.meta);
        this.seleccion.set({});
        this.cargando.set(false);
      },
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message);
        this.cargando.set(false);
      },
    });
  }

  seleccionar(id: number, estado: EstadoCarnet): void {
    this.seleccion.update((s) => ({ ...s, [id]: estado }));
  }

  buscar(event: Event): void {
    event.preventDefault();
    this.cargar(1);
  }

  limpiar(): void {
    this.q = '';
    this.cargar(1);
  }

  actualizar(event: Event, c: Carnet): void {
    event.preventDefault();
    const estado = this.seleccion()[c.id] ?? c.estado;
    this.procesando.set(c.id);
    this.service.adminCambiarEstado(c.id, estado).subscribe({
      next: (actualizado) => {
        this.items.update((list) => list.map((item) => (item.id === c.id ? actualizado : item)));
        this.alerts.success('Estado del carnet actualizado exitosamente.');
        this.procesando.set(null);
      },
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message || 'Error al actualizar el estado del carnet.');
        this.procesando.set(null);
      },
    });
  }
}
