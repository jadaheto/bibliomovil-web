import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { DashboardProfesional, DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard-profesional',
  imports: [RouterLink, DatePipe, LoadingComponent],
  template: `
    <div class="mb-4">
      <h1 class="welcome-title mb-1">¡Hola, {{ auth.primerNombre() }}! 👋</h1>
      <p class="welcome-subtitle mb-0">Bienvenido al Panel del Profesional de Apoyo.</p>
    </div>

    <div class="banner-notif mb-4">
      <div class="banner-notif-icon"><i class="ri-task-line"></i></div>
      <div>
        <div class="banner-notif-title">Registra ejecuciones pendientes</div>
        <div class="banner-notif-text">Recuerda registrar la ejecución de tus actividades completadas y generar el código QR para la evaluación por parte de las instituciones.</div>
      </div>
      <a routerLink="/actividades/nueva" class="banner-notif-btn">Crear Actividad</a>
    </div>

    @if (cargando()) {
      <app-loading />
    } @else if (datos(); as d) {
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-xl-3">
          <div class="quick-card">
            <div class="d-flex justify-content-between mb-3">
              <div><div class="quick-card-label mb-1">Actividades Programadas</div><div class="quick-card-value">{{ d.actividadesProgramadas }}</div></div>
              <div class="quick-card-icon-wrapper bg-warning-subtle text-warning"><i class="ri-calendar-event-line"></i></div>
            </div>
            <a routerLink="/profesional/actividades" class="quick-card-link">Ver listado <i class="ri-arrow-right-line"></i></a>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="quick-card">
            <div class="d-flex justify-content-between mb-3">
              <div><div class="quick-card-label mb-1">Actividades Ejecutadas</div><div class="quick-card-value">{{ d.actividadesEjecutadas }}</div></div>
              <div class="quick-card-icon-wrapper bg-success-subtle text-success"><i class="ri-checkbox-circle-line"></i></div>
            </div>
            <a routerLink="/profesional/actividades" class="quick-card-link">Ver completadas <i class="ri-arrow-right-line"></i></a>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="quick-card">
            <div class="d-flex justify-content-between mb-3">
              <div><div class="quick-card-label mb-1">Municipios Visitados</div><div class="quick-card-value">{{ d.municipiosVisitados.length }}</div></div>
              <div class="quick-card-icon-wrapper bg-info-subtle text-info"><i class="ri-map-pin-line"></i></div>
            </div>
            <a routerLink="/profesional/actividades" class="quick-card-link">Ver municipios <i class="ri-arrow-right-line"></i></a>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="quick-card">
            <div class="d-flex justify-content-between mb-3">
              <div><div class="quick-card-label mb-1">Participantes Atendidos</div><div class="quick-card-value">{{ d.totalParticipantes }}</div></div>
              <div class="quick-card-icon-wrapper bg-primary-subtle text-primary"><i class="ri-group-line"></i></div>
            </div>
            <a routerLink="/profesional/actividades" class="quick-card-link">Ver detalles <i class="ri-arrow-right-line"></i></a>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-xl-8">
          <div class="card-table-section">
            <div class="card-table-header">
              <h5 class="card-table-title">Mis Actividades Recientes</h5>
              <a routerLink="/profesional/actividades" class="btn-table-header">Ver todas</a>
            </div>
            <div class="table-container">
              <table class="table table-hover align-middle">
                <thead><tr><th>Fecha</th><th>Institución / Municipio</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  @for (a of d.actividadesRecientes; track a.id) {
                    <tr>
                      <td>{{ a.fechaActividad | date: 'dd/MM/yyyy' }}</td>
                      <td><div class="fw-bold">{{ a.nombreInstitucion || 'Sin institución' }}</div><small class="text-muted">{{ a.municipio }}</small></td>
                      <td>
                        @switch (a.estadoEvaluacion) {
                          @case ('Evaluada') { <span class="badge bg-success-subtle text-success">Evaluada</span> }
                          @case ('Cancelada') { <span class="badge bg-danger-subtle text-danger">Cancelada</span> }
                          @default { <span class="badge bg-warning-subtle text-warning">Programada</span> }
                        }
                      </td>
                      <td>
                        @if (a.estadoEvaluacion === 'Pendiente' && a.estadoAsignacion !== 'Completado') {
                          <a [routerLink]="['/profesional/actividades', a.id, 'ejecucion']" class="btn btn-primary btn-sm">Registrar Ejecución</a>
                        } @else {
                          <a [routerLink]="['/actividades', a.id]" class="btn btn-outline-primary btn-sm">Ver Detalle</a>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="4" class="text-center text-muted py-4">No tienes actividades programadas recientes.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-xl-4">
          <div class="card-membership text-center">
            <span class="badge-status">Activo</span>
            <div class="membership-name mt-3">{{ auth.user()?.nombre }}</div>
            <div class="mt-3 text-start">
              <div class="detail-item-label">Rol asignado</div>
              <div class="detail-item-value mb-2">Profesional de Biblioteca</div>
              <div class="detail-item-label">Especialidad</div>
              <div class="detail-item-value mb-2">Promotor de Lectura y Apoyo</div>
              <div class="detail-item-label">Municipios visitados</div>
              <div class="detail-item-value mb-3">{{ d.municipiosVisitados.join(', ') || 'Ninguno aún' }}</div>
            </div>
            <div class="membership-active-shield"><i class="ri-shield-check-line"></i><span>Perfil habilitado y verificado</span></div>
          </div>
        </div>
      </div>
    }
  `,
})
export class DashboardProfesionalComponent {
  readonly auth = inject(AuthService);
  readonly cargando = signal(true);
  readonly datos = signal<DashboardProfesional | null>(null);

  constructor() {
    inject(Title).setTitle('Dashboard - Profesional - Biblio Móvil');
    inject(DashboardService)
      .profesional()
      .subscribe({
        next: (d) => {
          this.datos.set(d);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }
}
