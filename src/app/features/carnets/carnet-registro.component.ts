import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { AlertService } from '../../core/ui/alert.service';
import { FieldErrorComponent } from '../../shared/components/field-error.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { marcarTodoTocado } from '../../shared/forms/form.utils';
import { CarnetsService, JORNADAS, RegistrarCarnetInput, TIPOS_IDENTIFICACION, TipoPersonaCarnet } from './carnets.service';

export const CAMPOS_DOCENTE = ['correo', 'telefono', 'area'] as const;
export const CAMPOS_ESTUDIANTE = ['grado', 'edad', 'jornada', 'acudiente', 'telefonoAcudiente'] as const;

/**
 * Activa los validadores del bloque correspondiente al tipo de persona y limpia
 * los del otro (equivalente al `required` dinámico del formulario original).
 */
export function aplicarValidadoresTipo(form: FormGroup, tipo: string): void {
  const docente = tipo === 'docente';
  const estudiante = tipo === 'estudiante';
  const set = (nombre: string, validadores: ValidatorFn[] | null) => {
    const control = form.get(nombre);
    if (!control) return;
    control.setValidators(validadores);
    control.updateValueAndValidity({ emitEvent: false });
  };
  set('correo', docente ? [Validators.required, Validators.email] : null);
  set('telefono', docente ? [Validators.required] : null);
  set('area', docente ? [Validators.required] : null);
  set('grado', estudiante ? [Validators.required] : null);
  set('edad', estudiante ? [Validators.required, Validators.min(5), Validators.max(25)] : null);
  set('jornada', estudiante ? [Validators.required] : null);
  set('acudiente', estudiante ? [Validators.required] : null);
  set('telefonoAcudiente', estudiante ? [Validators.required] : null);
}

export interface RegistroCarnetValores {
  tipoPersona: string;
  nombres: string;
  apellidos: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  correo: string;
  telefono: string;
  area: string;
  grado: string;
  edad: number | null;
  jornada: string;
  acudiente: string;
  telefonoAcudiente: string;
  institucionId: number | null;
}

/** Cuerpo de `POST /carnets`: solo los campos del bloque del tipo elegido. */
export function construirRegistroCarnet(v: RegistroCarnetValores, esAdmin: boolean): RegistrarCarnetInput {
  const base: RegistrarCarnetInput = {
    tipoPersona: v.tipoPersona as TipoPersonaCarnet,
    nombres: v.nombres.trim(),
    apellidos: v.apellidos.trim(),
    tipoIdentificacion: v.tipoIdentificacion,
    numeroIdentificacion: v.numeroIdentificacion.trim(),
  };
  if (v.tipoPersona === 'docente') {
    Object.assign(base, { correo: v.correo.trim(), telefono: v.telefono.trim(), area: v.area.trim() });
  } else {
    Object.assign(base, {
      grado: v.grado.trim(),
      edad: Number(v.edad),
      jornada: v.jornada,
      acudiente: v.acudiente.trim(),
      telefonoAcudiente: v.telefonoAcudiente.trim(),
    });
  }
  if (esAdmin && v.institucionId) base.institucionId = Number(v.institucionId);
  return base;
}

/** Registro de carnets digitales (institución carnetizada o administrador). */
@Component({
  selector: 'app-carnet-registro',
  imports: [ReactiveFormsModule, RouterLink, PageTitleComponent, FieldErrorComponent],
  template: `
    <app-page-title titulo="Registro de Carnets">
      <a routerLink="/carnets/historial" class="btn btn-outline-primary btn-sm"><i class="ri-history-line me-1"></i>Ver Historial</a>
    </app-page-title>

    <div class="row">
      <div class="col-lg-9">
        <div class="card">
          <div class="card-header bg-primary"><h5 class="card-title">Formulario de Registro</h5></div>
          <div class="card-body">
            @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
            <form [formGroup]="form" (ngSubmit)="registrar()" novalidate>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label">Tipo de Persona *</label>
                  <select class="form-select" formControlName="tipoPersona">
                    <option value="">Seleccione...</option>
                    <option value="docente">Docente</option>
                    <option value="estudiante">Estudiante</option>
                  </select>
                  <app-field-error [control]="form.controls.tipoPersona" etiqueta="El tipo de persona" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Nombres *</label>
                  <input class="form-control" formControlName="nombres" />
                  <app-field-error [control]="form.controls.nombres" etiqueta="Los nombres" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Apellidos *</label>
                  <input class="form-control" formControlName="apellidos" />
                  <app-field-error [control]="form.controls.apellidos" etiqueta="Los apellidos" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Tipo de Identificacion *</label>
                  <select class="form-select" formControlName="tipoIdentificacion">
                    <option value="">Seleccione...</option>
                    @for (t of tiposIdentificacion; track t.value) { <option [value]="t.value">{{ t.label }}</option> }
                  </select>
                  <app-field-error [control]="form.controls.tipoIdentificacion" etiqueta="El tipo de identificación" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Numero de Identificacion *</label>
                  <input class="form-control" formControlName="numeroIdentificacion" />
                  <app-field-error [control]="form.controls.numeroIdentificacion" etiqueta="El número de identificación" />
                </div>
                @if (auth.hasRole('administrador')) {
                  <div class="col-md-6">
                    <label class="form-label">ID de institución (opcional)</label>
                    <input type="number" class="form-control" formControlName="institucionId" min="1" placeholder="Institución a la que pertenece el carnet" />
                    <div class="form-text">Déjelo vacío para registrar el carnet sin institución.</div>
                  </div>
                }
              </div>

              @if (tipo() === 'docente') {
                <h6 class="text-primary fw-bold mt-4 mb-3"><i class="ri-user-star-line me-1"></i>Información del Docente</h6>
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label">Correo *</label>
                    <input type="email" class="form-control" formControlName="correo" />
                    <app-field-error [control]="form.controls.correo" etiqueta="El correo" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Telefono *</label>
                    <input class="form-control" formControlName="telefono" />
                    <app-field-error [control]="form.controls.telefono" etiqueta="El teléfono" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Area *</label>
                    <input class="form-control" formControlName="area" />
                    <app-field-error [control]="form.controls.area" etiqueta="El área" />
                  </div>
                </div>
              }

              @if (tipo() === 'estudiante') {
                <h6 class="text-success fw-bold mt-4 mb-3"><i class="ri-graduation-cap-line me-1"></i>Información del Estudiante</h6>
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label">Grado *</label>
                    <input class="form-control" formControlName="grado" />
                    <app-field-error [control]="form.controls.grado" etiqueta="El grado" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Edad *</label>
                    <input type="number" class="form-control" formControlName="edad" min="5" max="25" />
                    <app-field-error [control]="form.controls.edad" etiqueta="La edad" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Jornada *</label>
                    <select class="form-select" formControlName="jornada">
                      <option value="">Seleccione...</option>
                      @for (j of jornadas; track j) { <option [value]="j">{{ j }}</option> }
                    </select>
                    <app-field-error [control]="form.controls.jornada" etiqueta="La jornada" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Acudiente *</label>
                    <input class="form-control" formControlName="acudiente" />
                    <app-field-error [control]="form.controls.acudiente" etiqueta="El acudiente" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Telefono Acudiente *</label>
                    <input class="form-control" formControlName="telefonoAcudiente" />
                    <app-field-error [control]="form.controls.telefonoAcudiente" etiqueta="El teléfono del acudiente" />
                  </div>
                </div>
              }

              <div class="mt-4">
                <button type="submit" class="btn btn-primary" [disabled]="enviando()">
                  @if (enviando()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                  <i class="ri-id-card-line me-1"></i>Registrar Carnet
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CarnetRegistroComponent {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CarnetsService);
  private readonly alerts = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tiposIdentificacion = TIPOS_IDENTIFICACION;
  readonly jornadas = JORNADAS;
  readonly tipo = signal('');
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    tipoPersona: ['', Validators.required],
    nombres: ['', [Validators.required, Validators.maxLength(255)]],
    apellidos: ['', [Validators.required, Validators.maxLength(255)]],
    tipoIdentificacion: ['', Validators.required],
    numeroIdentificacion: ['', [Validators.required, Validators.maxLength(50)]],
    correo: [''],
    telefono: [''],
    area: [''],
    grado: [''],
    edad: [null as number | null],
    jornada: [''],
    acudiente: [''],
    telefonoAcudiente: [''],
    institucionId: [null as number | null],
  });

  constructor() {
    this.form.controls.tipoPersona.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((tipo) => {
      this.tipo.set(tipo);
      aplicarValidadoresTipo(this.form, tipo);
    });
  }

  registrar(): void {
    if (this.form.invalid) {
      marcarTodoTocado(this.form);
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.service.registrar(construirRegistroCarnet(this.form.getRawValue(), this.auth.hasRole('administrador'))).subscribe({
      next: () => {
        this.alerts.success('Carnet registrado exitosamente.');
        this.form.reset();
        this.enviando.set(false);
      },
      error: (err: ApiRequestError) => {
        this.error.set(err.details?.join(' ') ?? err.message ?? 'Error al registrar el carnet.');
        this.enviando.set(false);
      },
    });
  }
}
