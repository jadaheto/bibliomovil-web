import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { PaginatedMeta, PaginationComponent } from '../../shared/components/pagination.component';
import { Carnet, CarnetsService, badgeCarnet, tipoPersonaLabel } from './carnets.service';

/** Filtros rápidos mapeados a los estados reales (corrige el filtro inoperante del original). */
export const FILTROS_CARNETS: { label: string; value: string; clase: string }[] = [
  { label: 'Todos', value: '', clase: 'bg-primary' },
  { label: 'Pendientes', value: 'Pendiente', clase: 'bg-warning' },
  { label: 'Activos', value: 'Activo', clase: 'bg-success' },
  { label: 'Rechazados', value: 'Rechazado', clase: 'bg-danger' },
  { label: 'Suspendidos', value: 'Suspendido', clase: 'bg-secondary' },
  { label: 'Vencidos', value: 'Vencido', clase: 'bg-dark' },
];

/** Historial de carnets (la institución ve los suyos; el administrador, todos). */
@Component({
  selector: 'app-carnets-historial',
  imports: [FormsModule, DatePipe, RouterLink, PageTitleComponent, LoadingComponent, PaginationComponent],
  styles: `
    .filtro { cursor: pointer; opacity: 0.55; font-size: 0.85rem; padding: 0.45em 0.9em; }
    .filtro.activo, .filtro:hover { opacity: 1; }
  `,
  template: `
    <app-page-title titulo="Historial de Carnets" documento="Carnets - Historial">
      <a routerLink="/carnets/registro" class="btn btn-primary btn-sm"><i class="ri-add-line me-1"></i>Nuevo Carnet</a>
      <a [routerLink]="auth.homeFor(auth.rol())" class="btn btn-secondary btn-sm"><i class="ri-arrow-left-line me-1"></i>Volver</a>
    </app-page-title>

    <div class="card">
      <div class="card-header"><h5 class="card-title">Historial Completo</h5></div>
      <div class="card-body">
        <div class="d-flex flex-wrap gap-2 mb-3">
          @for (f of filtros; track f.value) {
            <span class="badge filtro" [class]="f.clase" [class.activo]="estado === f.value" role="button" (click)="filtrar(f.value)">{{ f.label }}</span>
          }
        </div>
        <form class="row g-2 align-items-center mb-3" (submit)="buscar($event)">
          <div class="col-md-6">
            <div class="input-group">
              <input type="search" class="form-control" [(ngModel)]="q" name="q" placeholder="Buscar por nombre, identificación o código..." />
              @if (q) {
                <button type="button" class="btn btn-outline-secondary" (click)="limpiar()" aria-label="Limpiar"><i class="ri-close-line"></i></button>
              }
              <button type="submit" class="btn btn-primary"><i class="ri-search-line me-1"></i>Buscar</button>
            </div>
          </div>
          <div class="col-md-6 text-md-end">
            @if (meta(); as m) { <span class="badge bg-light-purple text-primary">{{ m.total }} carnet(s)</span> }
          </div>
        </form>

        @if (cargando()) {
          <app-loading />
        } @else {
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr><th>Tipo</th><th>Nombre</th><th>Documento</th>@if (auth.hasRole('administrador')) { <th>Institución</th> }<th>Estado</th><th>Fecha</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                @for (c of items(); track c.id) {
                  <tr>
                    <td><span class="badge" [class]="c.tipoPersona === 'docente' ? 'bg-info' : 'bg-primary'">{{ tipo(c.tipoPersona) }}</span></td>
                    <td class="fw-bold">{{ c.nombres }} {{ c.apellidos }}</td>
                    <td>{{ c.tipoIdentificacion }} - {{ c.numeroIdentificacion }}</td>
                    @if (auth.hasRole('administrador')) { <td>{{ c.institucionNombre || 'N/A' }}</td> }
                    <td><span class="badge" [class]="badge(c.estado).clase">{{ badge(c.estado).texto }}</span></td>
                    <td>{{ c.createdAt | date: 'dd/MM/yyyy' }}</td>
                    <td><a [routerLink]="['/carnets', c.id]" class="btn btn-outline-primary btn-sm"><i class="ri-eye-line"></i> Ver Detalle</a></td>
                  </tr>
                } @empty {
                  <tr><td [attr.colspan]="auth.hasRole('administrador') ? 7 : 6" class="text-center text-muted py-4">No hay carnets registrados</td></tr>
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
export class CarnetsHistorialComponent {
  readonly auth = inject(AuthService);
  private readonly service = inject(CarnetsService);
  private readonly alerts = inject(AlertService);

  readonly filtros = FILTROS_CARNETS;
  readonly items = signal<Carnet[]>([]);
  readonly meta = signal<PaginatedMeta | null>(null);
  readonly cargando = signal(true);
  readonly badge = badgeCarnet;
  readonly tipo = tipoPersonaLabel;
  estado = '';
  q = '';

  constructor() {
    this.cargar(1);
  }

  cargar(page: number): void {
    this.cargando.set(true);
    this.service.historial({ estado: this.estado, q: this.q }, page).subscribe({
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

  filtrar(estado: string): void {
    this.estado = estado;
    this.cargar(1);
  }

  buscar(event: Event): void {
    event.preventDefault();
    this.cargar(1);
  }

  limpiar(): void {
    this.q = '';
    this.cargar(1);
  }
}
