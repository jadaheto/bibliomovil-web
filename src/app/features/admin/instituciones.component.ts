import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiRequestError, ApiService } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { Paginated, PaginatedMeta, PaginationComponent } from '../../shared/components/pagination.component';
import { EstadoBadgePipe } from '../../shared/pipes/estado-badge.pipe';
import { TitlecaseEsPipe } from '../../shared/pipes/titlecase-es.pipe';

interface InstitucionItem {
  institucion: {
    id: number;
    nombre: string;
    tipoInstitucion: string;
    municipio: string;
    carnetizada: boolean;
    createdAt: string;
  };
  representante: { id: number; nombre: string; correo: string; telefono: string | null; estado: string; createdAt: string } | null;
}

@Component({
  selector: 'app-instituciones',
  imports: [FormsModule, DatePipe, PageTitleComponent, LoadingComponent, PaginationComponent, EstadoBadgePipe, TitlecaseEsPipe],
  template: `
    <app-page-title titulo="Gestión de Instituciones" documento="Administración - Instituciones" />

    <div class="card">
      <div class="card-header bg-success"><h5 class="card-title">Historial de Instituciones</h5></div>
      <div class="card-body">
        <form class="row g-2 align-items-center mb-3" (submit)="buscar($event)">
          <div class="col-md-6">
            <div class="input-group">
              <input type="search" class="form-control" [(ngModel)]="q" name="q" placeholder="Buscar por nombre de institución o representante legal..." />
              @if (q) {
                <button type="button" class="btn btn-outline-secondary" (click)="limpiar()" aria-label="Limpiar"><i class="ri-close-line"></i></button>
              }
              <button type="submit" class="btn btn-primary"><i class="ri-search-line me-1"></i>Buscar</button>
            </div>
            <small class="text-muted">La búsqueda es insensible a mayúsculas/minúsculas y tildes.</small>
          </div>
          <div class="col-md-6 text-md-end">
            @if (meta()) { <span class="badge bg-light-purple text-primary">{{ meta()!.total }} resultado(s) encontrado(s)</span> }
          </div>
        </form>

        @if (cargando()) {
          <app-loading />
        } @else {
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>ID</th><th>Nombre Institución</th><th>Representante</th><th>Correo</th><th>Teléfono</th><th>Municipio</th>
                  <th>Estado</th><th class="text-nowrap">Es Carnetizada</th><th>Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                @for (item of items(); track item.institucion.id) {
                  <tr>
                    <td>#{{ item.representante?.id ?? item.institucion.id }}</td>
                    <td><div class="fw-semibold">{{ item.institucion.nombre }}</div><small class="text-muted">{{ item.institucion.tipoInstitucion }}</small></td>
                    <td>{{ item.representante?.nombre ?? '—' }}</td>
                    <td>{{ item.representante?.correo ?? '—' }}</td>
                    <td>{{ item.representante?.telefono ?? '—' }}</td>
                    <td>{{ item.institucion.municipio }}</td>
                    <td>
                      @if (item.representante; as r) {
                        <span [class]="r.estado | estadoBadge">{{ r.estado | titlecaseEs }}</span>
                      } @else { — }
                    </td>
                    <td>
                      <select class="form-select form-select-sm" style="width: 110px" [ngModel]="item.institucion.carnetizada ? '1' : '0'" (ngModelChange)="carnetizada(item, $event)" [name]="'c' + item.institucion.id" aria-label="Es carnetizada">
                        <option value="1">Sí</option>
                        <option value="0">No</option>
                      </select>
                    </td>
                    <td>{{ item.institucion.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="9" class="text-center text-muted py-4">{{ q ? 'No se encontraron instituciones que coincidan con "' + q + '".' : 'No hay instituciones registradas.' }}</td></tr>
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
export class InstitucionesComponent {
  private readonly api = inject(ApiService);
  private readonly alerts = inject(AlertService);
  readonly items = signal<InstitucionItem[]>([]);
  readonly meta = signal<PaginatedMeta | null>(null);
  readonly cargando = signal(true);
  q = '';

  constructor() {
    this.cargar(1);
  }

  cargar(page: number): void {
    this.cargando.set(true);
    this.api.get<Paginated<InstitucionItem>>('admin/instituciones', { q: this.q, page, limit: 20 }).subscribe({
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

  carnetizada(item: InstitucionItem, value: string): void {
    const carnetizada = value === '1';
    this.api.patch(`admin/instituciones/${item.institucion.id}/carnetizada`, { carnetizada }).subscribe({
      next: () => {
        item.institucion.carnetizada = carnetizada;
        this.alerts.success('Carnetización actualizada correctamente.');
      },
      error: (err: ApiRequestError) => this.alerts.error(err.message || 'Error al actualizar la carnetización.'),
    });
  }
}
