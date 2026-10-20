import { DatePipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiRequestError } from '../../core/api/api.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { CarnetPreviewComponent } from './carnet-preview.component';
import { CarnetPublico, CarnetsService, badgeCarnet, tipoPersonaLabel } from './carnets.service';

/** Verificación pública del carnet (destino del QR, sin sesión). */
@Component({
  selector: 'app-verificar-carnet',
  imports: [DatePipe, LoadingComponent, CarnetPreviewComponent],
  template: `
    <div class="text-center mb-4">
      <h4 class="fw-bold mb-1">Verificación de Carnet</h4>
      <p class="text-muted mb-0">Portal de Verificación Pública de Carnet Digital</p>
    </div>

    @if (cargando()) {
      <app-loading />
    } @else if (error()) {
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card text-center">
            <div class="card-body py-5">
              <i class="ri-error-warning-line text-danger" style="font-size: 3rem"></i>
              <h5 class="mt-3">Carnet no encontrado</h5>
              <p class="text-muted mb-0">{{ error() }}</p>
            </div>
          </div>
        </div>
      </div>
    } @else if (carnet(); as c) {
      <div class="row justify-content-center">
        <div class="col-lg-9">
          <div class="card">
            <div class="card-header bg-primary"><h5 class="card-title">Información del Carnet</h5></div>
            <div class="card-body">
              <div class="row g-4">
                <div class="col-md-5"><app-carnet-preview [carnet]="c" [qrDataUrl]="c.qrDataUrl" /></div>
                <div class="col-md-7">
                  <div class="alert" [class]="c.estado === 'Activo' ? 'alert-success' : 'alert-warning'">
                    <i class="me-1" [class]="c.estado === 'Activo' ? 'ri-shield-check-line' : 'ri-alert-line'"></i>
                    @if (c.estado === 'Activo') { Carnet válido y vigente. } @else { Este carnet se encuentra en estado <strong>{{ c.estado }}</strong>. }
                  </div>
                  <dl class="row mb-0">
                    <dt class="col-sm-5">Tipo</dt>
                    <dd class="col-sm-7"><span class="badge" [class]="c.tipoPersona === 'docente' ? 'bg-info' : 'bg-primary'">{{ tipo(c.tipoPersona) }}</span></dd>
                    <dt class="col-sm-5">Nombres</dt><dd class="col-sm-7">{{ c.nombres }}</dd>
                    <dt class="col-sm-5">Apellidos</dt><dd class="col-sm-7">{{ c.apellidos }}</dd>
                    <dt class="col-sm-5">Documento</dt><dd class="col-sm-7">{{ c.tipoIdentificacion }} - {{ c.numeroIdentificacion }}</dd>
                    <dt class="col-sm-5">Institución</dt><dd class="col-sm-7">{{ c.institucionNombre || 'N/A' }}</dd>
                    <dt class="col-sm-5">Estado</dt>
                    <dd class="col-sm-7"><span class="badge" [class]="badge(c.estado).clase">{{ c.estado }}</span></dd>
                    <dt class="col-sm-5">Vigencia</dt><dd class="col-sm-7">{{ c.vigenciaDias || 365 }} días</dd>
                    <dt class="col-sm-5">Fecha de Solicitud</dt><dd class="col-sm-7">{{ c.fechaSolicitud | date: 'dd/MM/yyyy' }}</dd>
                    <dt class="col-sm-5">Fecha de Vencimiento</dt><dd class="col-sm-7">{{ c.fechaVencimiento ? (c.fechaVencimiento | date: 'dd/MM/yyyy') : 'Pendiente' }}</dd>
                    @if (c.codigoCarnet) { <dt class="col-sm-5">Código del Carnet</dt><dd class="col-sm-7"><code>{{ c.codigoCarnet }}</code></dd> }
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class VerificarCarnetComponent {
  private readonly service = inject(CarnetsService);

  readonly id = input.required<string>();
  readonly carnet = signal<CarnetPublico | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly tipo = tipoPersonaLabel;
  readonly badge = badgeCarnet;

  constructor() {
    inject(Title).setTitle('Verificación de Carnet - Biblio Móvil');
  }

  ngOnInit(): void {
    this.service.verificar(this.id()).subscribe({
      next: (c) => {
        this.carnet.set(c);
        this.cargando.set(false);
      },
      error: (err: ApiRequestError) => {
        this.error.set(err.status === 404 ? 'El carnet consultado no existe o fue eliminado.' : err.message);
        this.cargando.set(false);
      },
    });
  }
}
