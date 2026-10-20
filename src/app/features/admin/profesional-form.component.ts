import { Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError, ApiService } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { FieldErrorComponent } from '../../shared/components/field-error.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { ESTADOS_PROFESIONAL } from '../../shared/constants/catalogos';
import { coincidenValidator, marcarTodoTocado } from '../../shared/forms/form.utils';
import { Profesional } from './profesionales.component';

/** Alta y edición de profesionales (misma vista; la contraseña es opcional al editar). */
@Component({
  selector: 'app-profesional-form',
  imports: [ReactiveFormsModule, RouterLink, PageTitleComponent, FieldErrorComponent],
  template: `
    <app-page-title [titulo]="esEdicion() ? 'Editar Profesional' : 'Registrar Nuevo Profesional'">
      <a routerLink="/admin/usuarios" class="btn btn-secondary btn-sm"><i class="ri-arrow-left-line me-1"></i>Volver al listado</a>
    </app-page-title>

    <div class="row">
      <div class="col-lg-8">
        <div class="card">
          <div class="card-header"><h5 class="card-title">Información del Profesional</h5></div>
          <div class="card-body">
            @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
            <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Nombre completo *</label>
                  <input class="form-control" formControlName="nombreCompleto" />
                  <app-field-error [control]="form.controls.nombreCompleto" etiqueta="El nombre completo" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Documento *</label>
                  <input class="form-control" formControlName="documento" />
                  <app-field-error [control]="form.controls.documento" etiqueta="El documento" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Cargo *</label>
                  <input class="form-control" formControlName="cargo" />
                  <app-field-error [control]="form.controls.cargo" etiqueta="El cargo" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Correo institucional *</label>
                  <input type="email" class="form-control" formControlName="correo" />
                  <div class="form-text">Este será el usuario para iniciar sesión</div>
                  <app-field-error [control]="form.controls.correo" etiqueta="El correo" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Teléfono *</label>
                  <input class="form-control" formControlName="telefono" />
                  <app-field-error [control]="form.controls.telefono" etiqueta="El teléfono" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Municipio base (Opcional)</label>
                  <input class="form-control" formControlName="municipioBase" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Estado</label>
                  <select class="form-select" formControlName="estado">
                    @for (e of estados; track e.value) { <option [value]="e.value">{{ e.label }}</option> }
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Rol</label>
                  <input class="form-control" value="Profesional" disabled />
                </div>
                <div class="col-md-6">
                  <label class="form-label">{{ esEdicion() ? 'Nueva contraseña' : 'Contraseña *' }}</label>
                  <input type="password" class="form-control" formControlName="contrasena" autocomplete="new-password" />
                  <div class="form-text">{{ esEdicion() ? 'Dejar vacío para conservar la actual.' : 'Mínimo 6 caracteres' }}</div>
                  <app-field-error [control]="form.controls.contrasena" etiqueta="La contraseña" />
                </div>
                @if (!esEdicion()) {
                  <div class="col-md-6">
                    <label class="form-label">Confirmar contraseña *</label>
                    <input type="password" class="form-control" formControlName="confirmarContrasena" autocomplete="new-password" />
                    <app-field-error [control]="form.controls.confirmarContrasena" etiqueta="La confirmación" />
                  </div>
                }
              </div>
              <div class="mt-4">
                <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                  @if (guardando()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                  {{ esEdicion() ? 'Guardar Cambios' : 'Registrar Profesional' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProfesionalFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  readonly id = input<string>();
  readonly esEdicion = computed(() => !!this.id());
  readonly estados = ESTADOS_PROFESIONAL;
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      nombreCompleto: ['', Validators.required],
      documento: ['', Validators.required],
      cargo: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      municipioBase: [''],
      estado: ['activo' as 'activo' | 'inactivo' | 'suspendido'],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasena: ['', Validators.required],
    },
    { validators: coincidenValidator('contrasena', 'confirmarContrasena') },
  );

  ngOnInit(): void {
    if (this.esEdicion()) {
      this.form.controls.contrasena.setValidators([Validators.minLength(6)]);
      this.form.controls.confirmarContrasena.clearValidators();
      this.form.updateValueAndValidity();
      this.api.get<Profesional>(`admin/profesionales/${this.id()}`).subscribe({
        next: (p) =>
          this.form.patchValue({
            nombreCompleto: p.nombreCompleto,
            documento: p.documento,
            cargo: p.cargo,
            correo: p.correo,
            telefono: p.telefono,
            municipioBase: p.municipioBase ?? '',
            estado: p.estado,
          }),
        error: (err: ApiRequestError) => {
          this.alerts.error(err.message || 'Profesional no encontrado.');
          void this.router.navigate(['/admin/usuarios']);
        },
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      marcarTodoTocado(this.form);
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const base = {
      nombreCompleto: v.nombreCompleto,
      documento: v.documento,
      cargo: v.cargo,
      correo: v.correo,
      telefono: v.telefono,
      municipioBase: v.municipioBase || undefined,
      estado: v.estado,
    };
    const request = this.esEdicion()
      ? this.api.put(`admin/profesionales/${this.id()}`, { ...base, contrasena: v.contrasena || undefined })
      : this.api.post('admin/profesionales', { ...base, contrasena: v.contrasena, confirmarContrasena: v.confirmarContrasena });

    request.subscribe({
      next: () => {
        this.alerts.success(this.esEdicion() ? 'Profesional actualizado correctamente.' : 'Profesional registrado exitosamente.');
        void this.router.navigate(['/admin/usuarios']);
      },
      error: (err: ApiRequestError) => {
        this.error.set(err.details?.join(' ') ?? err.message);
        this.guardando.set(false);
      },
    });
  }
}
