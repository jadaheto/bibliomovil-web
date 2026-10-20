import { DatePipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { EstadoBadgePipe } from '../../shared/pipes/estado-badge.pipe';
import { Solicitud, SolicitudesService } from './solicitudes.service';

@Component({
  selector: 'app-solicitud-detail',
  imports: [RouterLink, DatePipe, PageTitleComponent, LoadingComponent, EstadoBadgePipe],
  template: `
    <app-page-title [titulo]="'Detalle de Solicitud #' + id()" documento="Detalle de Solicitud">
      <a routerLink="/solicitudes" class="btn btn-secondary btn-sm"><i class="ri-arrow-left-line me-1"></i>Volver al listado</a>
    </app-page-title>

    @if (!solicitud()) {
      <app-loading />
    } @else if (solicitud(); as s) {
      <div class="row g-4">
        <div class="col-lg-8">
          <div class="card h-100">
            <div class="card-header bg-primary"><h5 class="card-title">Información General</h5></div>
            <div class="card-body">
              <dl class="row mb-0">
                <dt class="col-sm-5">Institución</dt><dd class="col-sm-7">{{ s.nombreInstitucion }}</dd>
                <dt class="col-sm-5">Representante</dt><dd class="col-sm-7">{{ s.nombreRepresentante }}</dd>
                <dt class="col-sm-5">Correo</dt><dd class="col-sm-7">{{ s.correo }}</dd>
                <dt class="col-sm-5">Teléfono</dt><dd class="col-sm-7">{{ s.telefono }}</dd>
                <dt class="col-sm-5">Número de Participantes</dt><dd class="col-sm-7">{{ s.numParticipantes || 'No especificado' }}</dd>
                <dt class="col-sm-5">Atención a Personas con Discapacidad</dt><dd class="col-sm-7">{{ s.atencionDiscapacidad ? 'Sí' : 'No' }}</dd>
                @if (s.atencionDiscapacidad) {
                  <dt class="col-sm-5">Tipo de Discapacidad</dt><dd class="col-sm-7">{{ s.tipoDiscapacidad || 'No especificado' }}</dd>
                }
                <dt class="col-sm-5">Clasificación de la Población</dt><dd class="col-sm-7">{{ s.clasificacionPoblacion || 'No especificada' }}</dd>
                <dt class="col-sm-5">Municipio</dt><dd class="col-sm-7">{{ s.municipio }}</dd>
                <dt class="col-sm-5">Ubicación del Evento</dt><dd class="col-sm-7">{{ s.ubicacionEvento }}</dd>
                <dt class="col-sm-5">Descripción del Espacio</dt><dd class="col-sm-7">{{ s.descEspacioFisico || 'No especificada' }}</dd>
                <dt class="col-sm-5">Objetivo</dt><dd class="col-sm-7" style="white-space: pre-line">{{ s.objetivoEvento }}</dd>
                <dt class="col-sm-5">Responsable del Evento</dt><dd class="col-sm-7">{{ s.responsableEvento || 'No especificado' }}</dd>
                <dt class="col-sm-5">Cargo del Responsable</dt><dd class="col-sm-7">{{ s.cargoResponsable || 'No especificado' }}</dd>
                <dt class="col-sm-5">Número de Contacto del Responsable</dt><dd class="col-sm-7">{{ s.telefonoResponsable || 'No especificado' }}</dd>
                <dt class="col-sm-5">Entidades Vinculadas</dt><dd class="col-sm-7">{{ s.entidadesVinculadas || 'Ninguna' }}</dd>
                <dt class="col-sm-5">Observaciones</dt><dd class="col-sm-7" style="white-space: pre-line">{{ s.observaciones || 'Sin observaciones' }}</dd>
                <dt class="col-sm-5">Política de Protección de Datos</dt><dd class="col-sm-7">{{ s.poliProteccionDatos ? 'Aceptada' : 'No aceptada' }}</dd>
                <dt class="col-sm-5">Fecha de registro</dt><dd class="col-sm-7">{{ s.createdAt | date: 'dd/MM/yyyy HH:mm' }}</dd>
              </dl>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card h-100">
            <div class="card-header"><h5 class="card-title">Estado</h5></div>
            <div class="card-body text-center">
              <span [class]="s.estado | estadoBadge" class="fs-5 px-4 py-2">{{ s.estado }}</span>
              @if (s.estado === 'Rechazada' && s.motivoRechazo) {
                <div class="alert alert-danger text-start mt-4 mb-0">
                  <div class="fw-bold mb-1">Motivo de rechazo:</div>
                  <div style="white-space: pre-line">{{ s.motivoRechazo }}</div>
                </div>
              }
              @if (s.estado === 'Pendiente') {
                <p class="text-muted mt-3 mb-0">La solicitud está pendiente de revisión por parte de Comfasucre.</p>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class SolicitudDetailComponent {
  private readonly service = inject(SolicitudesService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);
  readonly id = input.required<string>();
  readonly solicitud = signal<Solicitud | null>(null);

  ngOnInit(): void {
    this.service.obtener(this.id()).subscribe({
      next: (s) => this.solicitud.set(s),
      error: (err: ApiRequestError) => {
        this.alerts.error(err.status === 403 ? 'No tienes permiso para ver esta solicitud.' : err.message);
        void this.router.navigate(['/solicitudes']);
      },
    });
  }
}
