import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { EstadoBadgePipe } from '../../shared/pipes/estado-badge.pipe';
import { ReporteSolicitudes, SolicitudesService } from './solicitudes.service';

export const COLOR_ESTADO_SOLICITUD: Record<string, string> = { Pendiente: '#f7b84b', Aprobada: '#2ecc71', Rechazada: '#e74c3c' };

/** Vista imprimible del "Reporte de Solicitudes por Rango de Fechas" (PDF del sistema original). */
@Component({
  selector: 'app-solicitudes-reporte',
  imports: [RouterLink, DatePipe, PageTitleComponent, LoadingComponent, EstadoBadgePipe],
  template: `
    <div class="no-print">
      <app-page-title titulo="Reporte de Solicitudes" documento="Reporte de Solicitudes">
        <button type="button" class="btn btn-danger btn-sm" (click)="imprimir()" [disabled]="!reporte()"><i class="ri-printer-line me-1"></i>Imprimir / Guardar PDF</button>
        <a routerLink="/solicitudes" class="btn btn-secondary btn-sm"><i class="ri-arrow-left-line me-1"></i>Volver</a>
      </app-page-title>
    </div>

    @if (cargando()) {
      <app-loading />
    } @else if (reporte(); as r) {
      <div class="card reporte-print">
        <div class="card-body">
          <div class="text-center mb-4">
            <h3 class="fw-bold mb-1" style="color: #0b57d0">Reporte de Solicitudes por Rango de Fechas</h3>
            <div class="text-muted">Período: {{ r.periodo }}</div>
            <div class="text-muted fs-12">Biblio Móvil - Comfasucre</div>
          </div>

          <div class="row g-3 mb-4">
            <div class="col-md-4"><div class="border rounded p-3 text-center"><div class="text-muted fs-12 text-uppercase">Total solicitudes</div><div class="fs-3 fw-bold">{{ r.total }}</div></div></div>
            <div class="col-md-4"><div class="border rounded p-3 text-center"><div class="text-muted fs-12 text-uppercase">Rango</div><div class="fw-semibold">{{ r.periodo }}</div></div></div>
            <div class="col-md-4"><div class="border rounded p-3 text-center"><div class="text-muted fs-12 text-uppercase">Generado</div><div class="fw-semibold">{{ generado | date: 'dd/MM/yyyy HH:mm' }}</div></div></div>
          </div>

          <h5 class="fw-bold mb-2">Distribución por estado</h5>
          <div class="table-responsive mb-4">
            <table class="table table-bordered align-middle mb-0">
              <thead class="table-light"><tr><th>Estado</th><th class="text-end">Cantidad</th><th class="text-end">% del total</th><th style="width: 40%">Distribución visual</th></tr></thead>
              <tbody>
                @for (e of distribucion(); track e.estado) {
                  <tr>
                    <td><span class="badge" [style.background-color]="e.color">{{ e.estado }}</span></td>
                    <td class="text-end">{{ e.total }}</td>
                    <td class="text-end">{{ e.porcentaje }}%</td>
                    <td><div class="bg-light rounded" style="height: 14px"><div class="rounded" [style.width.%]="e.porcentaje" [style.background-color]="e.color" style="height: 14px"></div></div></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <h5 class="fw-bold mb-2">Detalle de solicitudes</h5>
          <div class="table-responsive">
            <table class="table table-bordered table-sm align-middle mb-0">
              <thead class="table-light">
                <tr><th>#</th><th>Fecha</th><th>Institución</th><th>Representante</th><th>Municipio</th><th>Teléfono</th><th>Correo</th><th>Part.</th><th>Estado</th></tr>
              </thead>
              <tbody>
                @for (s of r.solicitudes; track s.id; let i = $index) {
                  <tr>
                    <td>{{ i + 1 }}</td>
                    <td>{{ s.createdAt | date: 'dd/MM/yyyy' }}</td>
                    <td>{{ s.nombreInstitucion }}</td>
                    <td>{{ s.nombreRepresentante }}</td>
                    <td>{{ s.municipio }}</td>
                    <td>{{ s.telefono }}</td>
                    <td>{{ s.correo }}</td>
                    <td>{{ s.numParticipantes || '-' }}</td>
                    <td><span [class]="s.estado | estadoBadge">{{ s.estado }}</span></td>
                  </tr>
                } @empty {
                  <tr><td colspan="9" class="text-center text-muted py-3">No hay solicitudes registradas en el rango seleccionado.</td></tr>
                }
              </tbody>
            </table>
          </div>
          <p class="text-muted fs-12 text-center mt-4 mb-0">Documento generado automáticamente por el Sistema Biblio Móvil</p>
        </div>
      </div>
    } @else {
      <div class="card"><div class="card-body text-center text-muted py-4">No fue posible generar el reporte. <a routerLink="/solicitudes">Volver al listado</a></div></div>
    }
  `,
})
export class SolicitudesReporteComponent {
  private readonly service = inject(SolicitudesService);
  private readonly alerts = inject(AlertService);
  readonly fechaInicio = input<string>();
  readonly fechaFin = input<string>();
  readonly reporte = signal<ReporteSolicitudes | null>(null);
  readonly cargando = signal(true);
  readonly generado = new Date();

  readonly distribucion = computed(() => {
    const r = this.reporte();
    if (!r) return [];
    return (['Pendiente', 'Aprobada', 'Rechazada'] as const).map((estado) => {
      const total = r.estadosDist[estado] ?? 0;
      return { estado, total, porcentaje: r.total ? Math.round((total / r.total) * 1000) / 10 : 0, color: COLOR_ESTADO_SOLICITUD[estado] };
    });
  });

  ngOnInit(): void {
    this.service.reporte(this.fechaInicio() ?? '', this.fechaFin() ?? '').subscribe({
      next: (r) => {
        this.reporte.set(r);
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
