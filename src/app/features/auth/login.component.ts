import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { AlertService } from '../../core/ui/alert.service';
import { AlertsComponent } from '../../core/ui/alerts.component';
import { FieldErrorComponent } from '../../shared/components/field-error.component';
import { marcarTodoTocado } from '../../shared/forms/form.utils';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent, AlertsComponent],
  template: `
    <div class="card login-card">
      <div class="card-body px-4 py-3">
        <div class="login-header text-center mb-2">
          <h2>Inicio de sesión</h2>
          <p class="mb-0">Ingresa tus credenciales para acceder a Biblio Móvil</p>
        </div>
        <app-alerts />
        @if (error()) {
          <div class="alert alert-danger">{{ error() }}</div>
        }
        <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
          <div class="mb-3">
            <label class="form-label" for="correo">Correo Electrónico</label>
            <input id="correo" type="email" class="form-control" formControlName="correo" placeholder="admin@comfasucre.com" autocomplete="username" />
            <app-field-error [control]="form.controls.correo" etiqueta="El correo" />
          </div>
          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
              <label class="form-label" for="contrasena">Contraseña</label>
              <a class="footer-link text-muted fs-12" href="#" (click)="olvide($event)">¿Ha olvidado su contraseña?</a>
            </div>
            <div class="position-relative">
              <input id="contrasena" [type]="verContrasena() ? 'text' : 'password'" class="form-control pe-5" formControlName="contrasena" placeholder="••••••••" autocomplete="current-password" />
              <button type="button" class="password-toggle" (click)="verContrasena.set(!verContrasena())" aria-label="Mostrar contraseña">
                <i [class]="verContrasena() ? 'ri-eye-off-line' : 'ri-eye-line'"></i>
              </button>
            </div>
            <app-field-error [control]="form.controls.contrasena" etiqueta="La contraseña" />
          </div>
          <button type="submit" class="btn btn-teal w-100" [disabled]="cargando()">
            @if (cargando()) { <span class="spinner-border spinner-border-sm me-2"></span> }
            Iniciar sesión
          </button>
        </form>
        <div class="d-flex align-items-center my-2 text-muted fs-12">
          <hr class="flex-grow-1 my-0" /><span class="px-2">o</span><hr class="flex-grow-1 my-0" />
        </div>
        <a [href]="googleUrl" class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2">
          <i class="ri-google-fill"></i> Ingresar con Google <span class="fs-12 opacity-75">(&#64;comfasucre.com.co)</span>
        </a>
        <p class="text-center text-muted mt-3 mb-0 fs-14">
          ¿Primera vez en el portal? <a routerLink="/registro-institucion" class="footer-link">Regístrate aquí</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly alerts = inject(AlertService);

  readonly form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required]],
  });
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly verContrasena = signal(false);
  readonly googleUrl = `${environment.apiUrl}/auth/google`;

  constructor() {
    inject(Title).setTitle('Iniciar Sesión - Biblio Móvil Comfasucre');
    // Errores del ingreso con Google llegan como ?error=... desde el callback de la API.
    this.error.set(this.route.snapshot.queryParamMap.get('error'));
  }

  enviar(): void {
    if (this.form.invalid) {
      marcarTodoTocado(this.form);
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    const { correo, contrasena } = this.form.getRawValue();
    this.auth.login(correo.trim(), contrasena).subscribe({
      next: (res) => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        void this.router.navigateByUrl(returnUrl && returnUrl !== '/login' ? returnUrl : this.auth.homeFor(res.usuario.rol));
      },
      error: (err: ApiRequestError) => {
        this.error.set(err.message);
        this.cargando.set(false);
      },
    });
  }

  olvide(event: Event): void {
    event.preventDefault();
    this.alerts.error('Función no disponible. Contacte al administrador.');
  }
}
