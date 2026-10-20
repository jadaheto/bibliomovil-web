import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { Calificacion, GRUPOS_CALIFICACION, promedio1 } from './calificaciones';
import { DetalleEvaluacionActividad, EvaluacionesService } from './evaluaciones.service';

/** "Evaluación - {actividad}": promedios de las 15 calificaciones y respuestas abiertas. */
@Component({
  selector: 'app-evaluacion-detail',
  imports: [RouterLink, PageTitleComponent, LoadingComponent],
  template: `
    <app-page-title [titulo]="'Evaluación - ' + (detalle()?.actividad?.descripcionActividad ?? '')" documento="Detalle de Evaluación">
      <a routerLink="/evaluaciones" class="btn btn-secondary btn-sm"><i class="ri-arrow-left-line me-1"></i>Volver al listado</a>
    </app-page-title>

    @if (!detalle()) {
      <app-loading />
    } @else if (detalle(); as d) {
      <div class="card">
        <div class="card-header bg-primary"><h5 class="card-title">Resultados de la Evaluación (Promedio de {{ d.totalEvaluaciones }} evaluaciones)</h5></div>
        <div class="card-body">
          <p class="text-muted mb-3">
            <i class="ri-building-line me-1"></i>{{ d.actividad.nombreInstitucion || 'N/A' }} · {{ d.actividad.municipio }}
          </p>
          @for (g of grupos; track g.titulo) {
            <h6 class="text-uppercase fw-bold fs-12 mb-2" [class]="g.clase">{{ g.titulo }}</h6>
            <div class="row g-2 mb-4">
              @for (item of g.items; track item.key) {
                <div class="col-6 col-md-4 col-xl">
                  <div class="border rounded p-2 text-center h-100">
                    <div class="fs-12 text-muted">{{ item.corta }}</div>
                    <div class="fs-4 fw-bold" [class]="g.clase">{{ valor(d, item.key) }}/5</div>
                  </div>
                </div>
              }
            </div>
          }
          <div class="alert alert-light border text-center fs-5 mb-0">
            <strong>Promedio General: </strong><span class="text-primary fw-bold">{{ promedio(d.promedioGeneral) }}/5</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h5 class="card-title">Respuestas Abiertas de los Beneficiarios</h5></div>
        <div class="card-body">
          @for (r of d.respuestasAbiertas; track r.evaluacionId; let i = $index) {
            <div class="border rounded p-3 mb-3">
              <h6 class="fw-bold mb-2">Evaluación #{{ i + 1 }} @if (r.edadParticipante) { <small class="text-muted fw-normal">· Edad: {{ r.edadParticipante }}</small> }</h6>
              <p class="mb-1"><strong>Actividad más significativa:</strong> {{ r.actividadMasSignificativa || 'Sin respuesta' }}</p>
              <p class="mb-1"><strong>Nuevas temáticas sugeridas:</strong> {{ r.tematicasSugeridas || 'Sin respuesta' }}</p>
              <p class="mb-0"><strong>Comentarios o sugerencias generales:</strong> {{ r.comentariosSugerenciasGenerales || 'Sin respuesta' }}</p>
            </div>
          } @empty {
            <p class="text-muted mb-0">No se han registrado respuestas abiertas para esta actividad.</p>
          }
        </div>
      </div>
    }
  `,
})
export class EvaluacionDetailComponent {
  private readonly service = inject(EvaluacionesService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);
  readonly id = input.required<string>();
  readonly grupos = GRUPOS_CALIFICACION;
  readonly detalle = signal<DetalleEvaluacionActividad | null>(null);

  ngOnInit(): void {
    this.service.detalle(this.id()).subscribe({
      next: (d) => this.detalle.set(d),
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message);
        void this.router.navigate(['/evaluaciones']);
      },
    });
  }

  valor(d: DetalleEvaluacionActividad, key: Calificacion): string {
    return promedio1(d.promedios?.[key]);
  }

  promedio(v: number): string {
    return promedio1(v);
  }
}
