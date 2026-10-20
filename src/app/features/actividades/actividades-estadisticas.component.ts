import { DatePipe, SlicePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { ActividadesService, EstadisticasActividades } from './actividades.service';

/** Vista imprimible "Estadísticas de Actividades y Resultados por Profesional" (administrador). */
@Component({
  selector: 'app-actividades-estadisticas',
  imports: [RouterLink, DatePipe, SlicePipe, PageTitleComponent, LoadingComponent],
  template: `
    <div class="no-print">
      <app-page-title titulo="Estadísticas de Actividades" documento="Estadísticas de Actividades">
        <button type="button" class="btn btn-danger btn-sm" (click)="imprimir()" [disabled]="!datos()"><i class="ri-printer-line me-1"></i>Imprimir / Guardar PDF</button>
        <a routerLink="/dashboard" class="btn btn-secondary btn-sm"><i class="ri-arrow-left-line me-1"></i>Volver</a>
      </app-page-title>
    </div>

    @if (cargando()) {
      <app-loading />
    } @else if (datos(); as d) {
      <div class="card">
        <div class="card-body">
          <div class="text-center mb-4">
            <h3 class="fw-bold mb-1" style="color: #0b57d0">Estadísticas de Actividades y Resultados por Profesional</h3>
            <div class="text-muted fs-12">Biblio Móvil - Comfasucre</div>
          </div>
          <div class="row g-3 mb-4">
            <div class="col-md-3"><div class="border rounded p-3 text-center"><div class="text-muted fs-12 text-uppercase">Total de actividades</div><div class="fs-3 fw-bold">{{ d.totalActividades }}</div></div></div>
            <div class="col-md-3"><div class="border rounded p-3 text-center"><div class="text-muted fs-12 text-uppercase">Resultados subidos por profesionales</div><div class="fs-3 fw-bold">{{ d.resultadosPorProfesional.length }}</div></div></div>
            <div class="col-md-3"><div class="border rounded p-3 text-center"><div class="text-muted fs-12 text-uppercase">Períodos</div><div class="fs-3 fw-bold">{{ d.porMes.length }}</div></div></div>
            <div class="col-md-3"><div class="border rounded p-3 text-center"><div class="text-muted fs-12 text-uppercase">Generado</div><div class="fw-semibold">{{ generado | date: 'dd/MM/yyyy HH:mm' }}</div></div></div>
          </div>

          <h5 class="fw-bold mb-2">1. Actividades por Mes</h5>
          <div class="table-responsive mb-4">
            <table class="table table-bordered align-middle mb-0">
              <thead class="table-light"><tr><th>#</th><th>Año</th><th>Mes</th><th class="text-end">Cantidad</th><th class="text-end">% del total</th><th style="width: 35%">Distribución</th></tr></thead>
              <tbody>
                @for (m of porMes(); track m.anio + '-' + m.mes; let i = $index) {
                  <tr>
                    <td>{{ i + 1 }}</td><td>{{ m.anio }}</td><td>{{ m.mesNombre }}</td>
                    <td class="text-end">{{ m.total }}</td><td class="text-end">{{ m.porcentaje }}%</td>
                    <td><div class="bg-light rounded" style="height: 14px"><div class="rounded" [style.width.%]="m.porcentaje" style="height: 14px; background-color: #0b57d0"></div></div></td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="text-center text-muted py-3">No hay actividades registradas.</td></tr>
                }
              </tbody>
              @if (d.porMes.length) {
                <tfoot class="table-light fw-bold"><tr><td colspan="3">TOTAL</td><td class="text-end">{{ totalMeses() }}</td><td class="text-end">100%</td><td></td></tr></tfoot>
              }
            </table>
          </div>

          <h5 class="fw-bold mb-2">2. Resultados subidos por los profesionales</h5>
          <div class="table-responsive">
            <table class="table table-bordered table-sm align-middle mb-0" style="font-size: 0.8rem">
              <thead style="background-color: #5c59e8; color: #fff">
                <tr><th>Fecha</th><th>Profesional</th><th>Institución</th><th>Resultados</th><th>Impacto percibido</th><th>Dificultades</th><th>Propuestas</th></tr>
              </thead>
              <tbody>
                @for (r of d.resultadosPorProfesional; track r.asignacionId) {
                  <tr>
                    <td class="text-nowrap">{{ r.fechaActividad | date: 'dd/MM/yyyy' }}</td>
                    <td><div class="fw-semibold">{{ r.profesionalNombre }}</div><small class="text-muted">{{ r.tituloActividad | slice: 0 : 60 }}{{ r.tituloActividad.length > 60 ? '…' : '' }}</small></td>
                    <td><div>{{ r.nombreInstitucion || r.tipoInstitucion }}</div><small class="text-muted">{{ r.municipio }}</small></td>
                    <td>{{ truncar(r.resultados, 250) }}</td>
                    <td>{{ truncar(r.impactoPercibido, 180) }}</td>
                    <td>{{ truncar(r.dificultades, 180) }}</td>
                    <td>{{ truncar(r.propuestasMejora, 180) }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="7" class="text-center text-muted py-3">Aún no hay resultados subidos por profesionales.</td></tr>
                }
              </tbody>
            </table>
          </div>
          <p class="text-muted fs-12 text-center mt-4 mb-0">Documento generado automáticamente por el Sistema Biblio Móvil</p>
        </div>
      </div>
    }
  `,
})
export class ActividadesEstadisticasComponent {
  private readonly alerts = inject(AlertService);
  readonly datos = signal<EstadisticasActividades | null>(null);
  readonly cargando = signal(true);
  readonly generado = new Date();

  readonly totalMeses = computed(() => (this.datos()?.porMes ?? []).reduce((acc, m) => acc + m.total, 0));
  readonly porMes = computed(() => {
    const total = this.totalMeses();
    return (this.datos()?.porMes ?? []).map((m) => ({ ...m, porcentaje: total ? Math.round((m.total / total) * 1000) / 10 : 0 }));
  });

  constructor() {
    inject(ActividadesService)
      .estadisticas()
      .subscribe({
        next: (d) => {
          this.datos.set(d);
          this.cargando.set(false);
        },
        error: (err: ApiRequestError) => {
          this.alerts.error(err.message);
          this.cargando.set(false);
        },
      });
  }

  truncar(texto: string | null, max: number): string {
    if (!texto) return '-';
    return texto.length > max ? `${texto.slice(0, max)}…` : texto;
  }

  imprimir(): void {
    window.print();
  }
}
