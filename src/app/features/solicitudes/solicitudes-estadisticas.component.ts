import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { COLOR_ESTADO_SOLICITUD } from './solicitudes-reporte.component';
import { EstadisticasSolicitudes, SolicitudesService } from './solicitudes.service';

/** Vista imprimible de "Estadísticas de Solicitudes por Mes". */
@Component({
  selector: 'app-solicitudes-estadisticas',
  imports: [RouterLink, DatePipe, PageTitleComponent, LoadingComponent],
  template: `
    <div class="no-print">
      <app-page-title titulo="Estadísticas de Solicitudes" documento="Estadísticas de Solicitudes">
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
            <h3 class="fw-bold mb-1" style="color: #0b57d0">Estadísticas de Solicitudes por Mes</h3>
            <div class="text-muted fs-12">Biblio Móvil - Comfasucre</div>
          </div>

          <div class="row g-3 mb-4">
            <div class="col-md-4"><div class="border rounded p-3 text-center"><div class="text-muted fs-12 text-uppercase">Total de solicitudes acumuladas</div><div class="fs-3 fw-bold">{{ total() }}</div></div></div>
            <div class="col-md-4"><div class="border rounded p-3 text-center"><div class="text-muted fs-12 text-uppercase">Períodos con registros</div><div class="fs-3 fw-bold">{{ d.porMes.length }}</div></div></div>
            <div class="col-md-4"><div class="border rounded p-3 text-center"><div class="text-muted fs-12 text-uppercase">Generado</div><div class="fw-semibold">{{ generado | date: 'dd/MM/yyyy HH:mm' }}</div></div></div>
          </div>

          <h5 class="fw-bold mb-2">Solicitudes por mes</h5>
          <div class="table-responsive mb-4">
            <table class="table table-bordered align-middle mb-0">
              <thead class="table-light"><tr><th>#</th><th>Año</th><th>Mes</th><th class="text-end">Cantidad</th><th class="text-end">% del total</th><th style="width: 35%">Distribución visual</th></tr></thead>
              <tbody>
                @for (m of porMes(); track m.anio + '-' + m.mes; let i = $index) {
                  <tr>
                    <td>{{ i + 1 }}</td>
                    <td>{{ m.anio }}</td>
                    <td>{{ m.mesNombre }}</td>
                    <td class="text-end">{{ m.total }}</td>
                    <td class="text-end">{{ m.porcentaje }}%</td>
                    <td><div class="bg-light rounded" style="height: 14px"><div class="rounded" [style.width.%]="m.porcentaje" style="height: 14px; background-color: #0b57d0"></div></div></td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="text-center text-muted py-3">No hay solicitudes registradas en el sistema.</td></tr>
                }
              </tbody>
              @if (d.porMes.length) {
                <tfoot class="table-light fw-bold"><tr><td colspan="3">TOTAL</td><td class="text-end">{{ total() }}</td><td class="text-end">100%</td><td></td></tr></tfoot>
              }
            </table>
          </div>

          <h5 class="fw-bold mb-2">Distribución por Estado</h5>
          <div class="table-responsive">
            <table class="table table-bordered align-middle mb-0">
              <thead style="background-color: #5c59e8; color: #fff"><tr><th>Estado</th><th class="text-end">Cantidad</th><th class="text-end">%</th></tr></thead>
              <tbody>
                @for (e of porEstado(); track e.estado) {
                  <tr>
                    <td><span class="badge" [style.background-color]="e.color">{{ e.estado }}</span></td>
                    <td class="text-end">{{ e.total }}</td>
                    <td class="text-end">{{ e.porcentaje }}%</td>
                  </tr>
                } @empty {
                  <tr><td colspan="3" class="text-center text-muted py-3">No hay solicitudes registradas en el sistema.</td></tr>
                }
              </tbody>
              @if (d.porEstado.length) {
                <tfoot class="table-light fw-bold"><tr><td>TOTAL</td><td class="text-end">{{ total() }}</td><td class="text-end">100%</td></tr></tfoot>
              }
            </table>
          </div>
          <p class="text-muted fs-12 text-center mt-4 mb-0">Documento generado automáticamente por el Sistema Biblio Móvil</p>
        </div>
      </div>
    }
  `,
})
export class SolicitudesEstadisticasComponent {
  private readonly alerts = inject(AlertService);
  readonly datos = signal<EstadisticasSolicitudes | null>(null);
  readonly cargando = signal(true);
  readonly generado = new Date();

  readonly total = computed(() => (this.datos()?.porMes ?? []).reduce((acc, m) => acc + m.total, 0));
  readonly porMes = computed(() => {
    const total = this.total();
    return (this.datos()?.porMes ?? []).map((m) => ({ ...m, porcentaje: total ? Math.round((m.total / total) * 1000) / 10 : 0 }));
  });
  readonly porEstado = computed(() => {
    const lista = this.datos()?.porEstado ?? [];
    const total = lista.reduce((acc, e) => acc + e.total, 0);
    return lista.map((e) => ({ ...e, porcentaje: total ? Math.round((e.total / total) * 1000) / 10 : 0, color: COLOR_ESTADO_SOLICITUD[e.estado] ?? '#718096' }));
  });

  constructor() {
    inject(SolicitudesService)
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

  imprimir(): void {
    window.print();
  }
}
