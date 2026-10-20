import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError, ApiService } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { FieldErrorComponent } from '../../shared/components/field-error.component';
import { MUNICIPIOS_SUCRE, TIPOS_INSTITUCION } from '../../shared/constants/catalogos';
import { coincidenValidator, marcarTodoTocado } from '../../shared/forms/form.utils';

@Component({
  selector: 'app-registro-institucion',
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent],
  template: `
    <div class="card login-card">
      <div class="card-body p-4 p-md-5">
        <div class="login-header text-center mb-4">
          <h2>Registro de Institución</h2>
          <p class="mb-0">Completa el formulario para registrar una nueva institución externa en el portal Biblio Móvil.</p>
        </div>
        @if (error()) {
          <div class="alert alert-danger">{{ error() }}</div>
        }
        <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
          <h6 class="text-uppercase text-muted fw-bold fs-12 mb-3">Datos de la Institución</h6>
          <div class="row g-3 mb-4">
            <div class="col-12">
              <label class="form-label">Nombre de la Institución *</label>
              <input class="form-control" formControlName="nombreInstitucion" placeholder="Ej. Colegio Nacional" />
              <app-field-error [control]="form.controls.nombreInstitucion" etiqueta="El nombre" />
            </div>
            <div class="col-md-6">
              <label class="form-label">NIT (opcional)</label>
              <input class="form-control" formControlName="nit" placeholder="Ej. 900.123.456-7" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Tipo de Institución *</label>
              <select class="form-select" formControlName="tipoInstitucion">
                <option value="">Seleccionar...</option>
                @for (t of tipos; track t.value) { <option [value]="t.value">{{ t.label }}</option> }
              </select>
              <app-field-error [control]="form.controls.tipoInstitucion" etiqueta="El tipo" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Municipio *</label>
              <select class="form-select" formControlName="municipio">
                <option value="">Seleccionar municipio...</option>
                @for (m of municipios; track m) { <option [value]="m">{{ m }}</option> }
              </select>
              <app-field-error [control]="form.controls.municipio" etiqueta="El municipio" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Teléfono de la Institución *</label>
              <input class="form-control" formControlName="telefono" placeholder="Ej. 3001234567" />
              <app-field-error [control]="form.controls.telefono" etiqueta="El teléfono" />
            </div>
            <div class="col-12">
              <label class="form-label">Dirección *</label>
              <input class="form-control" formControlName="direccion" placeholder="Ej. Calle 20 # 15-30" />
              <app-field-error [control]="form.controls.direccion" etiqueta="La dirección" />
            </div>
          </div>

          <h6 class="text-uppercase text-muted fw-bold fs-12 mb-3">Datos del Representante</h6>
          <div class="row g-3 mb-4">
            <div class="col-12">
              <label class="form-label">Nombre del Representante *</label>
              <input class="form-control" formControlName="nombreRepresentante" placeholder="Nombre completo" />
              <app-field-error [control]="form.controls.nombreRepresentante" etiqueta="El nombre" />
            </div>
            <div class="col-12">
              <label class="form-label">Correo Electrónico *</label>
              <input type="email" class="form-control" formControlName="correo" placeholder="correo@ejemplo.com" autocomplete="username" />
              <app-field-error [control]="form.controls.correo" etiqueta="El correo" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Contraseña *</label>
              <input type="password" class="form-control" formControlName="contrasena" placeholder="Mínimo 6 caracteres" autocomplete="new-password" />
              <app-field-error [control]="form.controls.contrasena" etiqueta="La contraseña" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Confirmar Contraseña *</label>
              <input type="password" class="form-control" formControlName="confirmarContrasena" placeholder="Repite la contraseña" autocomplete="new-password" />
              <app-field-error [control]="form.controls.confirmarContrasena" etiqueta="La confirmación" />
            </div>
          </div>

          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-teal" [disabled]="cargando()">
              @if (cargando()) { <span class="spinner-border spinner-border-sm me-2"></span> }
              Crear Cuenta
            </button>
            <a routerLink="/login" class="btn btn-light">Ya tengo cuenta - Iniciar Sesión</a>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class RegistroInstitucionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  readonly tipos = TIPOS_INSTITUCION;
  readonly municipios = MUNICIPIOS_SUCRE;
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      nombreInstitucion: ['', [Validators.required, Validators.maxLength(255)]],
      nit: [''],
      tipoInstitucion: ['', Validators.required],
      municipio: ['', Validators.required],
      direccion: ['', Validators.required],
      telefono: ['', Validators.required],
      nombreRepresentante: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasena: ['', [Validators.required, Validators.minLength(6)]],
    },
    { validators: coincidenValidator('contrasena', 'confirmarContrasena') },
  );

  constructor() {
    inject(Title).setTitle('Registro de Institución - Biblio Móvil Comfasucre');
  }

  enviar(): void {
    if (this.form.invalid) {
      marcarTodoTocado(this.form);
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();
    this.api.post<{ mensaje: string }>('auth/registro-institucion', { ...value, nit: value.nit || undefined }).subscribe({
      next: (res) => {
        this.alerts.success(res.mensaje);
        void this.router.navigate(['/login']);
      },
      error: (err: ApiRequestError) => {
        this.error.set(err.message);
        this.cargando.set(false);
      },
    });
  }
}
