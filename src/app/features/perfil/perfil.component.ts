import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiRequestError, ApiService } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { ROL_LABEL } from '../../core/models/auth.models';
import { AlertService } from '../../core/ui/alert.service';
import { FieldErrorComponent } from '../../shared/components/field-error.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { TitlecaseEsPipe } from '../../shared/pipes/titlecase-es.pipe';
import { coincidenValidator, marcarTodoTocado } from '../../shared/forms/form.utils';

interface Perfil {
  id: number;
  nombre: string;
  correo: string;
  rol: 'administrador' | 'profesional' | 'institucion';
  cargo: string | null;
  telefono: string | null;
  estado: string;
  institucion: {
    id: number;
    nombre: string;
    nit: string | null;
    nombreRector: string | null;
    telefono: string | null;
    direccion: string | null;
    municipio: string;
    carnetizada: boolean;
    fechaCarnetizacion: string | null;
    tipoInstitucion: string;
  } | null;
  profesional: { nombreCompleto: string; documento: string; cargo: string; telefono: string; municipioBase: string | null; estado: string } | null;
}

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, PageTitleComponent, LoadingComponent, ModalComponent, FieldErrorComponent, TitlecaseEsPipe],
  template: `
    <app-page-title titulo="Mi Perfil">
      <a [routerLink]="auth.homeFor(auth.rol())" class="btn btn-secondary btn-sm"><i class="ri-arrow-left-line me-1"></i>Volver al Dashboard</a>
    </app-page-title>

    @if (!perfil()) {
      <app-loading />
    } @else if (perfil(); as p) {
      <div class="row">
        <div class="col-lg-8">
          <div class="card">
            <div class="card-header bg-primary"><h5 class="card-title">Información del Perfil</h5></div>
            <div class="card-body">
              <dl class="row mb-0">
                <dt class="col-sm-4">Usuario</dt><dd class="col-sm-8">{{ p.nombre }}</dd>
                <dt class="col-sm-4">Correo</dt><dd class="col-sm-8">{{ p.correo }}</dd>
                <dt class="col-sm-4">Rol</dt><dd class="col-sm-8">{{ rolLabel(p.rol) }}</dd>
                <dt class="col-sm-4">Estado</dt>
                <dd class="col-sm-8"><span class="badge" [class]="p.estado === 'activa' ? 'bg-success' : 'bg-warning'">{{ p.estado | titlecaseEs }}</span></dd>
              </dl>

              @if (p.institucion; as i) {
                <h6 class="text-uppercase text-muted fw-bold fs-12 mt-3 mb-3">Datos de la Institución</h6>
                <dl class="row mb-0">
                  <dt class="col-sm-4">Nombre del Colegio</dt><dd class="col-sm-8">{{ i.nombre }}</dd>
                  <dt class="col-sm-4">NIT</dt><dd class="col-sm-8">{{ i.nit || 'No registrado' }}</dd>
                  <dt class="col-sm-4">Nombre del Rector</dt><dd class="col-sm-8">{{ i.nombreRector || 'No registrado' }}</dd>
                  <dt class="col-sm-4">Teléfono</dt><dd class="col-sm-8">{{ i.telefono || 'No registrado' }}</dd>
                  <dt class="col-sm-4">Dirección</dt><dd class="col-sm-8">{{ i.direccion || 'No registrada' }}</dd>
                  <dt class="col-sm-4">Municipio</dt><dd class="col-sm-8">{{ i.municipio }}</dd>
                </dl>
                <h6 class="text-uppercase text-muted fw-bold fs-12 mt-3 mb-3">Caracterización</h6>
                <dl class="row mb-0">
                  <dt class="col-sm-4">Institución Carnetizada</dt>
                  <dd class="col-sm-8"><span class="badge" [class]="i.carnetizada ? 'bg-success' : 'bg-secondary'">{{ i.carnetizada ? 'Sí' : 'No' }}</span></dd>
                  <dt class="col-sm-4">Fecha de Carnetización</dt><dd class="col-sm-8">{{ i.fechaCarnetizacion ? (i.fechaCarnetizacion | date: 'dd/MM/yyyy') : 'Pendiente' }}</dd>
                </dl>
              }

              @if (p.profesional; as pr) {
                <h6 class="text-uppercase text-muted fw-bold fs-12 mt-3 mb-3">Datos del Profesional</h6>
                <dl class="row mb-0">
                  <dt class="col-sm-4">Nombre Completo</dt><dd class="col-sm-8">{{ pr.nombreCompleto }}</dd>
                  <dt class="col-sm-4">Documento</dt><dd class="col-sm-8">{{ pr.documento }}</dd>
                  <dt class="col-sm-4">Cargo</dt><dd class="col-sm-8">{{ pr.cargo }}</dd>
                  <dt class="col-sm-4">Teléfono</dt><dd class="col-sm-8">{{ pr.telefono }}</dd>
                  <dt class="col-sm-4">Municipio Base</dt><dd class="col-sm-8">{{ pr.municipioBase || 'No especificado' }}</dd>
                </dl>
              }

              <div class="d-flex gap-2 mt-3">
                <button type="button" class="btn btn-primary" (click)="abrirEditar(p)"><i class="ri-edit-line me-1"></i>Editar Perfil</button>
                <button type="button" class="btn btn-outline-secondary" (click)="modalClave.set(true)"><i class="ri-lock-line me-1"></i>Cambiar Contraseña</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }

    <app-modal [abierto]="modalEditar()" titulo="Editar Perfil" (cerrar)="modalEditar.set(false)">
      <form [formGroup]="form" (ngSubmit)="guardar()" novalidate id="formPerfil">
        <div class="mb-3">
          <label class="form-label">Nombre</label>
          <input class="form-control" formControlName="nombre" />
          <app-field-error [control]="form.controls.nombre" etiqueta="El nombre" />
        </div>
        <div class="mb-3">
          <label class="form-label">Correo Electrónico</label>
          <input type="email" class="form-control" formControlName="correo" />
          <app-field-error [control]="form.controls.correo" etiqueta="El correo" />
        </div>
        <div class="mb-3">
          <label class="form-label">Teléfono</label>
          <input class="form-control" formControlName="telefono" />
        </div>
        @if (auth.hasRole('institucion')) {
          <div class="mb-3">
            <label class="form-label">Nombre del Rector</label>
            <input class="form-control" formControlName="nombreRector" />
          </div>
          <div class="mb-3">
            <label class="form-label">Dirección</label>
            <input class="form-control" formControlName="direccion" />
          </div>
        }
      </form>
      <div modal-footer class="modal-footer">
        <button type="button" class="btn btn-light" (click)="modalEditar.set(false)">Cancelar</button>
        <button type="submit" form="formPerfil" class="btn btn-primary" [disabled]="guardando()">Guardar Cambios</button>
      </div>
    </app-modal>

    <app-modal [abierto]="modalClave()" titulo="Cambiar Contraseña" (cerrar)="modalClave.set(false)">
      <form [formGroup]="formClave" (ngSubmit)="cambiarClave()" novalidate id="formClave">
        <div class="mb-3">
          <label class="form-label">Contraseña actual</label>
          <input type="password" class="form-control" formControlName="contrasenaActual" autocomplete="current-password" />
          <app-field-error [control]="formClave.controls.contrasenaActual" etiqueta="La contraseña actual" />
        </div>
        <div class="mb-3">
          <label class="form-label">Nueva contraseña</label>
          <input type="password" class="form-control" formControlName="contrasenaNueva" autocomplete="new-password" />
          <app-field-error [control]="formClave.controls.contrasenaNueva" etiqueta="La nueva contraseña" />
        </div>
        <div class="mb-3">
          <label class="form-label">Confirmar nueva contraseña</label>
          <input type="password" class="form-control" formControlName="confirmar" autocomplete="new-password" />
          <app-field-error [control]="formClave.controls.confirmar" etiqueta="La confirmación" />
        </div>
      </form>
      <div modal-footer class="modal-footer">
        <button type="button" class="btn btn-light" (click)="modalClave.set(false)">Cancelar</button>
        <button type="submit" form="formClave" class="btn btn-primary" [disabled]="guardando()">Actualizar</button>
      </div>
    </app-modal>
  `,
})
export class PerfilComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly alerts = inject(AlertService);
  private readonly fb = inject(FormBuilder);

  readonly perfil = signal<Perfil | null>(null);
  readonly modalEditar = signal(false);
  readonly modalClave = signal(false);
  readonly guardando = signal(false);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    telefono: [''],
    nombreRector: [''],
    direccion: [''],
  });
  readonly formClave = this.fb.nonNullable.group(
    {
      contrasenaActual: ['', Validators.required],
      contrasenaNueva: ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', Validators.required],
    },
    { validators: coincidenValidator('contrasenaNueva', 'confirmar') },
  );

  constructor() {
    this.cargar();
  }

  rolLabel(rol: Perfil['rol']): string {
    return ROL_LABEL[rol];
  }

  private cargar(): void {
    this.api.get<Perfil>('perfil').subscribe({ next: (p) => this.perfil.set(p) });
  }

  abrirEditar(p: Perfil): void {
    this.form.reset({
      nombre: p.nombre,
      correo: p.correo,
      telefono: p.institucion?.telefono ?? p.profesional?.telefono ?? p.telefono ?? '',
      nombreRector: p.institucion?.nombreRector ?? '',
      direccion: p.institucion?.direccion ?? '',
    });
    this.modalEditar.set(true);
  }

  guardar(): void {
    if (this.form.invalid) {
      marcarTodoTocado(this.form);
      return;
    }
    this.guardando.set(true);
    const v = this.form.getRawValue();
    const body: Record<string, string> = { nombre: v.nombre, correo: v.correo, telefono: v.telefono };
    if (this.auth.hasRole('institucion')) {
      body['nombreRector'] = v.nombreRector;
      body['direccion'] = v.direccion;
    }
    if (this.auth.hasRole('profesional')) body['nombreCompleto'] = v.nombre;
    this.api.patch<Perfil>('perfil', body).subscribe({
      next: (p) => {
        this.perfil.set(p);
        this.modalEditar.set(false);
        this.guardando.set(false);
        this.alerts.success('Perfil actualizado exitosamente.');
        this.auth.refreshCurrent().subscribe({ error: () => undefined });
      },
      error: (err: ApiRequestError) => {
        this.guardando.set(false);
        this.alerts.error(err.message);
        this.modalEditar.set(false);
      },
    });
  }

  cambiarClave(): void {
    if (this.formClave.invalid) {
      marcarTodoTocado(this.formClave);
      return;
    }
    this.guardando.set(true);
    const { contrasenaActual, contrasenaNueva } = this.formClave.getRawValue();
    this.api.post('perfil/cambiar-contrasena', { contrasenaActual, contrasenaNueva }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalClave.set(false);
        this.formClave.reset();
        this.alerts.success('Contraseña actualizada exitosamente.');
      },
      error: (err: ApiRequestError) => {
        this.guardando.set(false);
        this.modalClave.set(false);
        this.alerts.error(err.message);
      },
    });
  }
}
