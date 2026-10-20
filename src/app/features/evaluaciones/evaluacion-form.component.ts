import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { FieldErrorComponent } from '../../shared/components/field-error.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { marcarTodoTocado } from '../../shared/forms/form.utils';
import { CALIFICACIONES, Calificacion, Calificaciones, ESCALA_INTERNA, GRUPOS_CALIFICACION } from './calificaciones';
import { EvaluacionesService } from './evaluaciones.service';

/** Formulario interno "Nueva Evaluación" (escala 1 - Muy bajo … 5 - Muy alto). */
@Component({
  selector: 'app-evaluacion-form',
  imports: [ReactiveFormsModule, RouterLink, PageTitleComponent, FieldErrorComponent],
  template: `
    <app-page-title titulo="Evaluación de Impacto y Satisfacción" documento="Nueva Evaluación">
      <a routerLink="/evaluaciones" class="btn btn-secondary btn-sm"><i class="ri-arrow-left-line me-1"></i>Volver al listado</a>
    </app-page-title>

    <div class="row">
      <div class="col-lg-10">
        <div class="card">
          <div class="card-header bg-primary"><h5 class="card-title">Formulario de Evaluación</h5></div>
          <div class="card-body">
            @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
            <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
              <div class="row g-3 mb-3">
                <div class="col-md-4">
                  <label class="form-label">ID de la Actividad *</label>
                  <input type="number" min="1" class="form-control" formControlName="actividadId" />
                  <app-field-error [control]="form.controls.actividadId" etiqueta="El ID de la actividad" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Edad del participante</label>
                  <input type="number" min="1" max="120" class="form-control" formControlName="edadParticipante" />
                  <app-field-error [control]="form.controls.edadParticipante" etiqueta="La edad" />
                </div>
              </div>

              @for (g of grupos; track g.titulo; let gi = $index) {
                <h6 class="text-uppercase fw-bold fs-12 mt-2 mb-2" [class]="g.clase">{{ g.titulo }}{{ gi === 0 ? ' (Escala 1-5)' : '' }}</h6>
                <div class="row g-3 mb-3">
                  @for (item of g.items; track item.key) {
                    <div class="col-md-4 col-xl">
                      <label class="form-label">{{ item.interna }} *</label>
                      <select class="form-select" [formControlName]="item.key">
                        <option value="">Seleccione...</option>
                        @for (o of escala; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
                      </select>
                      <app-field-error [control]="control(item.key)" [etiqueta]="item.interna" />
                    </div>
                  }
                </div>
              }

              <h6 class="text-uppercase fw-bold fs-12 text-muted mt-2 mb-2">Preguntas Abiertas</h6>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Actividad más significativa</label>
                  <textarea class="form-control" rows="2" formControlName="actividadMasSignificativa"></textarea>
                </div>
                <div class="col-12">
                  <label class="form-label">Nuevas temáticas sugeridas</label>
                  <textarea class="form-control" rows="2" formControlName="tematicasSugeridas"></textarea>
                </div>
                <div class="col-12">
                  <label class="form-label">Comentarios o sugerencias generales</label>
                  <textarea class="form-control" rows="2" formControlName="comentariosSugerenciasGenerales"></textarea>
                </div>
              </div>

              <div class="mt-4">
                <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                  @if (guardando()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                  <i class="ri-save-line me-1"></i>Guardar Evaluación
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class EvaluacionFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EvaluacionesService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  /** `?actividadId=N` prellena el ID. */
  readonly actividadId = input<string>();
  readonly grupos = GRUPOS_CALIFICACION;
  readonly escala = ESCALA_INTERNA;
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    actividadId: ['', [Validators.required, Validators.min(1)]],
    edadParticipante: ['', [Validators.min(1), Validators.max(120)]],
    actividadMasSignificativa: [''],
    tematicasSugeridas: [''],
    comentariosSugerenciasGenerales: [''],
    ...(Object.fromEntries(CALIFICACIONES.map((c) => [c, ['', Validators.required]])) as Record<Calificacion, [string, typeof Validators.required]>),
  });

  ngOnInit(): void {
    const pre = this.actividadId();
    if (pre) this.form.controls.actividadId.setValue(pre);
  }

  control(key: Calificacion): FormControl<string> {
    return this.form.controls[key];
  }

  guardar(): void {
    if (this.form.invalid) {
      marcarTodoTocado(this.form);
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const calificaciones = Object.fromEntries(CALIFICACIONES.map((c) => [c, Number(v[c])])) as Calificaciones;
    this.service
      .crear({
        ...calificaciones,
        actividadId: Number(v.actividadId),
        edadParticipante: v.edadParticipante ? Number(v.edadParticipante) : undefined,
        actividadMasSignificativa: v.actividadMasSignificativa.trim() || undefined,
        tematicasSugeridas: v.tematicasSugeridas.trim() || undefined,
        comentariosSugerenciasGenerales: v.comentariosSugerenciasGenerales.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.alerts.success('Evaluación registrada correctamente.');
          void this.router.navigate(['/evaluaciones']);
        },
        error: (err: ApiRequestError) => {
          this.error.set(err.details?.join(' ') ?? err.message);
          this.guardando.set(false);
        },
      });
  }
}
