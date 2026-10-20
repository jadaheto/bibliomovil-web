import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { ActividadesService, CalendarioMensual, badgeActividad, etiquetaEstadoActividad } from './actividades.service';

/** Vista imprimible "Calendario de Actividades - {Mes} {Año}" (administrador). */
@Component({
  selector: 'app-calendario-mensual',
  imports: [RouterLink, DatePipe, DecimalPipe, PageTitleComponent, LoadingComponent],
  template: `
    <div class="no-print">
      <app-page-title titulo="Calendario mensual de actividades" documento="Calendario de Actividades PDF">
        <button type="button" class="btn btn-danger btn-sm" (click)="imprimir()" [disabled]="!datos()"><i class="ri-printer-line me-1"></i>Imprimir / Guardar PDF</button>
        <a routerLink="/actividades" class="btn btn-secondary btn-sm"><i class="ri-arrow-left-line me-1"></i>Volver</a>
      </app-page-title>
    </div>

    @if (cargando()) {
      <app-loading />
    } @else if (datos(); as d) {
      <div class="card">
        <div class="card-body">
          <div class="text-center mb-4">
            <h3 class="fw-bold mb-1" style="color: #0b57d0">Calendario de Actividades - {{ d.mesNombre }} {{ d.anio }}</h3>
            <div class="text-muted fs-12">Biblio Móvil - Comfasucre</div>
          </div>
          <div class="row g-3 mb-4">
            <div class="col-md-4"><div class="border rounded p-3 text-center"><div class="text-muted fs-12 text-uppercase">Total de actividades</div><div class="fs-3 fw-bold">{{ d.total }}</div></div></div>
            <div class="col-md-4"><div class="border rounded p-3 text-center"><div class="text-muted fs-12 text-uppercase">Días con actividades</div><div class="fs-3 fw-bold">{{ d.diasConActividades }}</div></div></div>
            <div class="col-md-4"><div class="border rounded p-3 text-center"><div class="text-muted fs-12 text-uppercase">Generado</div><div class="fw-semibold">{{ generado | date: 'dd/MM/yyyy HH:mm' }}</div></div></div>
          </div>

          @for (dia of d.dias; track dia.dia) {
            <div class="mb-4">
              <div class="rounded-top px-3 py-2 text-white fw-bold" style="background-color: #0b57d0">
                Día {{ dia.dia | number: '2.0-0' }} de {{ d.mesNombre }} — {{ dia.actividades.length }} actividad(es)
              </div>
              <div class="table-responsive">
                <table class="table table-bordered table-sm align-middle mb-0">
                  <thead class="table-light"><tr><th>Hora</th><th>Institución</th><th>Municipio</th><th>Part.</th><th>Responsable</th><th>Contacto</th><th>Estado</th></tr></thead>
                  <tbody>
                    @for (a of dia.actividades; track a.id) {
                      <tr>
                        <td>{{ a.hora }}</td>
                        <td><div>{{ a.institucion }}</div><small class="text-muted">{{ a.descripcionActividad }} · {{ a.profesionales }}</small></td>
                        <td>{{ a.municipio }}</td>
                        <td>{{ a.participantes }}</td>
                        <td>{{ a.responsable || '-' }}</td>
                        <td>{{ a.contacto || '-' }}</td>
                        <td><span [class]="badge(a.estado)">{{ etiqueta(a.estado) }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          } @empty {
            <p class="text-center text-muted py-4 mb-0">No hay actividades registradas en este mes.</p>
          }
          <p class="text-muted fs-12 text-center mt-4 mb-0">Documento generado automáticamente por el Sistema Biblio Móvil</p>
        </div>
      </div>
    }
  `,
})
export class CalendarioMensualComponent {
  private readonly service = inject(ActividadesService);
  private readonly alerts = inject(AlertService);
  readonly mes = input<string>();
  readonly anio = input<string>();
  readonly datos = signal<CalendarioMensual | null>(null);
  readonly cargando = signal(true);
  readonly generado = new Date();

  ngOnInit(): void {
    this.service.calendarioMensual(this.mes(), this.anio()).subscribe({
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

  badge(estado: string): string {
    return badgeActividad(estado);
  }

  etiqueta(estado: string): string {
    return etiquetaEstadoActividad(estado);
  }

  imprimir(): void {
    window.print();
  }
}
