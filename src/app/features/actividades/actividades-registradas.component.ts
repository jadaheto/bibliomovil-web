import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { PaginatedMeta, PaginationComponent } from '../../shared/components/pagination.component';
import { MESES } from '../../shared/constants/catalogos';
import { Actividad, ActividadesService, ESTADOS_ACTIVIDAD, EstadoActividad, badgeActividad, etiquetaEstadoActividad } from './actividades.service';
import { HoraPipe } from './hora.pipe';

/** Tabla "Actividades Registradas" (administrador). */
@Component({
  selector: 'app-actividades-registradas',
  imports: [FormsModule, RouterLink, DatePipe, PageTitleComponent, LoadingComponent, PaginationComponent, HoraPipe],
  template: `
    <app-page-title titulo="Registro de Actividades" documento="Actividades">
      <a routerLink="/actividades" class="btn btn-secondary btn-sm"><i class="ri-arrow-left-line me-1"></i>Devolver</a>
      <a routerLink="/actividades/nueva" class="btn btn-primary btn-sm"><i class="ri-add-line me-1"></i>Nueva Actividad</a>
    </app-page-title>

    <div class="card">
      <div class="card-header"><h5 class="card-title">Actividades Registradas</h5></div>
      <div class="card-body">
        <form class="row g-2 align-items-end mb-3">
          <div class="col-md-3">
            <label class="form-label">Mes</label>
            <select class="form-select" [(ngModel)]="mes" name="mes" (ngModelChange)="cargar(1)">
              <option [ngValue]="''">Todos</option>
              @for (m of meses; track m; let i = $index) { <option [ngValue]="i + 1">{{ m }}</option> }
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Año</label>
            <select class="form-select" [(ngModel)]="anio" name="anio" (ngModelChange)="cargar(1)">
              <option [ngValue]="''">Todos</option>
              @for (a of anios; track a) { <option [ngValue]="a">{{ a }}</option> }
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Estado</label>
            <select class="form-select" [(ngModel)]="estado" name="estado" (ngModelChange)="cargar(1)">
              <option value="">Todos</option>
              @for (e of estados; track e) { <option [value]="e">{{ etiqueta(e) }}</option> }
            </select>
          </div>
          <div class="col-md-3 text-md-end">
            @if (meta(); as m) { <span class="badge bg-light-purple text-primary">{{ m.total }} actividad(es)</span> }
          </div>
        </form>

        @if (cargando()) {
          <app-loading />
        } @else {
          <div class="table-responsive">
            <table class="table table-hover align-middle table-nowrap mb-0">
              <thead class="table-light">
                <tr><th>ID</th><th>Fecha</th><th>Hora inicio</th><th>Hora finalización</th><th>Profesional(es)</th><th>Municipio</th><th>Institución</th><th>Eje Mensual</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                @for (a of items(); track a.id) {
                  <tr>
                    <td>{{ a.id }}</td>
                    <td>{{ a.fechaActividad | date: 'dd/MM/yyyy' }}</td>
                    <td>{{ a.horaInicio | hora }}</td>
                    <td>{{ a.horaFinalizacion | hora }}</td>
                    <td>{{ nombresProfesionales(a) }}</td>
                    <td>{{ a.municipio }}</td>
                    <td>{{ a.institucionVisible || a.tipoInstitucion }}</td>
                    <td>{{ a.ejeMensual }}</td>
                    <td><span [class]="badge(a.estadoEvaluacion)">{{ a.estadoEvaluacion === 'Pendiente' ? 'Pendiente' : a.estadoEvaluacion }}</span></td>
                    <td><a [routerLink]="['/actividades', a.id]" class="btn btn-outline-primary btn-sm"><i class="ri-eye-line"></i> Ver</a></td>
                  </tr>
                } @empty {
                  <tr><td colspan="10" class="text-center text-muted py-4">No hay actividades registradas.</td></tr>
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
export class ActividadesRegistradasComponent {
  private readonly service = inject(ActividadesService);
  private readonly alerts = inject(AlertService);
  readonly meses = MESES;
  readonly estados = ESTADOS_ACTIVIDAD;
  readonly anios = (() => {
    const actual = new Date().getFullYear();
    const lista: number[] = [];
    for (let a = actual + 1; a >= actual - 5; a--) lista.push(a);
    return lista;
  })();
  readonly items = signal<Actividad[]>([]);
  readonly meta = signal<PaginatedMeta | null>(null);
  readonly cargando = signal(true);
  mes: number | '' = '';
  anio: number | '' = '';
  estado: EstadoActividad | '' = '';

  constructor() {
    this.cargar(1);
  }

  cargar(page: number): void {
    this.cargando.set(true);
    this.service.listar({ mes: this.mes, anio: this.anio, estado: this.estado, page }).subscribe({
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

  nombresProfesionales(a: Actividad): string {
    return a.profesionales.map((p) => p.nombreCompleto).join(', ') || 'Sin asignar';
  }

  badge(estado: string): string {
    return badgeActividad(estado);
  }

  etiqueta(estado: string): string {
    return etiquetaEstadoActividad(estado);
  }
}
