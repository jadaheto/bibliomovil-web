import { Component, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { FieldErrorComponent } from '../../shared/components/field-error.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { marcarTodoTocado } from '../../shared/forms/form.utils';
import { Libro, LibrosService } from '../libros/libros.service';
import { PersonaTipoPrestamo, PrestamosService, TIPOS_PERSONA_PRESTAMO } from './prestamos.service';

/** Fecha local de hoy en formato `YYYY-MM-DD`. */
export function hoyIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** La fecha límite no puede ser anterior a hoy (misma regla que el backend). */
export const noAnteriorAHoy: ValidatorFn = (control: AbstractControl) => {
  const value = control.value as string;
  return value && value < hoyIso() ? { min: { min: hoyIso() } } : null;
};

/** Formulario de solicitud de préstamo (institución). */
@Component({
  selector: 'app-prestamo-solicitar',
  imports: [ReactiveFormsModule, RouterLink, PageTitleComponent, FieldErrorComponent],
  template: `
    <app-page-title titulo="Solicitar Préstamo">
      <a routerLink="/prestamos" class="btn btn-secondary btn-sm"><i class="ri-arrow-left-line me-1"></i>Volver</a>
    </app-page-title>

    <div class="row">
      <div class="col-lg-8">
        <div class="card">
          <div class="card-header bg-primary"><h5 class="card-title">Formulario de Solicitud</h5></div>
          <div class="card-body">
            @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
            <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Libro *</label>
                  <select class="form-select" formControlName="libroId">
                    <option value="">{{ cargandoLibros() ? 'Cargando libros...' : 'Seleccionar libro...' }}</option>
                    @for (l of libros(); track l.id) { <option [value]="l.id">{{ l.titulo }} - {{ l.autor }}</option> }
                  </select>
                  <app-field-error [control]="form.controls.libroId" etiqueta="El libro" />
                  @if (!cargandoLibros() && libros().length === 0) {
                    <div class="form-text text-warning">No hay libros disponibles para préstamo en este momento.</div>
                  }
                </div>
                <div class="col-md-6">
                  <label class="form-label">Nombre del solicitante *</label>
                  <input class="form-control" formControlName="personaNombre" />
                  <app-field-error [control]="form.controls.personaNombre" etiqueta="El nombre" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Documento del solicitante *</label>
                  <input class="form-control" formControlName="personaId" />
                  <app-field-error [control]="form.controls.personaId" etiqueta="El documento" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Correo electrónico *</label>
                  <input type="email" class="form-control" formControlName="personaEmail" />
                  <app-field-error [control]="form.controls.personaEmail" etiqueta="El correo" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Tipo de persona</label>
                  <select class="form-select" formControlName="personaTipo">
                    @for (t of tipos; track t) { <option [value]="t">{{ t === 'Institucion' ? 'Institución' : t }}</option> }
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Fecha límite de devolución *</label>
                  <input type="date" class="form-control" formControlName="fechaLimiteDevolucion" [min]="hoy" />
                  <app-field-error [control]="form.controls.fechaLimiteDevolucion" etiqueta="La fecha límite" />
                </div>
                <div class="col-12">
                  <label class="form-label">Observaciones</label>
                  <textarea class="form-control" rows="3" formControlName="observaciones"></textarea>
                </div>
              </div>
              <div class="mt-4 d-flex gap-2">
                <button type="submit" class="btn btn-primary" [disabled]="enviando()">
                  @if (enviando()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                  <i class="ri-shopping-cart-line me-1"></i>Solicitar Préstamo
                </button>
                <a routerLink="/prestamos" class="btn btn-light">Cancelar</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PrestamoSolicitarComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PrestamosService);
  private readonly librosService = inject(LibrosService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  /** Query param `?libroId=` (preselección desde el catálogo). */
  readonly libroId = input<string>();
  readonly tipos = TIPOS_PERSONA_PRESTAMO;
  readonly hoy = hoyIso();
  readonly libros = signal<Libro[]>([]);
  readonly cargandoLibros = signal(true);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    libroId: ['', Validators.required],
    personaNombre: ['', [Validators.required, Validators.maxLength(255)]],
    personaId: ['', [Validators.required, Validators.maxLength(100)]],
    personaEmail: ['', [Validators.required, Validators.email]],
    personaTipo: ['Estudiante' as PersonaTipoPrestamo],
    fechaLimiteDevolucion: ['', [Validators.required, noAnteriorAHoy]],
    observaciones: [''],
  });

  ngOnInit(): void {
    const pre = this.libroId();
    if (pre) this.form.controls.libroId.setValue(pre);
    this.librosService.disponibles().subscribe({
      next: (list) => {
        this.libros.set(list);
        this.cargandoLibros.set(false);
        if (pre && !list.some((l) => String(l.id) === pre)) {
          this.form.controls.libroId.setValue('');
          this.alerts.warning('El libro seleccionado no está disponible para préstamo.');
        }
      },
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message);
        this.cargandoLibros.set(false);
      },
    });
  }

  enviar(): void {
    if (this.form.invalid) {
      marcarTodoTocado(this.form);
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.service
      .solicitar({
        libroId: Number(v.libroId),
        personaTipo: v.personaTipo,
        personaNombre: v.personaNombre,
        personaId: v.personaId,
        personaEmail: v.personaEmail,
        fechaLimiteDevolucion: v.fechaLimiteDevolucion,
        observaciones: v.observaciones || undefined,
      })
      .subscribe({
        next: () => {
          this.alerts.success('Préstamo solicitado exitosamente.');
          void this.router.navigate(['/prestamos']);
        },
        error: (err: ApiRequestError) => {
          this.error.set(err.details?.join(' ') ?? err.message);
          this.enviando.set(false);
        },
      });
  }
}
