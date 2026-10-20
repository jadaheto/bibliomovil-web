import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { EstadoBadgePipe } from '../../shared/pipes/estado-badge.pipe';
import { InicialesPipe } from '../../shared/pipes/iniciales.pipe';
import { ActividadReciente, DashboardService, SolicitudReciente } from './dashboard.service';

interface Kpi {
  label: string;
  value: number;
  icono: string;
  color: string;
  link: string;
  linkText: string;
}

/** Inicio para administrador e institución (misma vista con KPIs según rol). */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, LoadingComponent, EstadoBadgePipe, InicialesPipe],
  template: `
    <div class="mb-4">
      <h1 class="welcome-title mb-1">¡Hola, {{ auth.primerNombre().toUpperCase() }}! 👋</h1>
      <p class="welcome-subtitle mb-0">
        {{ auth.hasRole('institucion') ? 'Bienvenido al Dashboard Institucional de Comfasucre.' : 'Bienvenido a tu Biblio Móvil.' }}
      </p>
    </div>

    @if (cargando()) {
      <app-loading />
    } @else {
      <div class="row g-3 mb-4">
        @for (k of kpis(); track k.label) {
          <div class="col-sm-6 col-xl-3">
            <div class="quick-card">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <div class="quick-card-label mb-1">{{ k.label }}</div>
                  <div class="quick-card-value">{{ k.value }}</div>
                </div>
                <div class="quick-card-icon-wrapper" [class]="k.color"><i [class]="k.icono"></i></div>
              </div>
              <a [routerLink]="k.link" class="quick-card-link">{{ k.linkText }} <i class="ri-arrow-right-line"></i></a>
            </div>
          </div>
        }
      </div>

      @if (auth.hasRole('administrador')) {
        <div class="d-flex gap-2 flex-wrap mb-4">
          <a routerLink="/solicitudes/estadisticas" class="btn btn-danger btn-sm"><i class="ri-file-pdf-line me-1"></i>Estadísticas de solicitudes (PDF)</a>
          <a routerLink="/actividades/estadisticas" class="btn btn-danger btn-sm"><i class="ri-file-pdf-line me-1"></i>Estadísticas de actividades (PDF)</a>
        </div>
      }

      <div class="row g-4">
        <div class="col-xl-6">
          <div class="card-table-section h-100">
            <div class="card-table-header">
              <h5 class="card-table-title">{{ auth.hasRole('institucion') ? 'Mis Últimas Solicitudes' : 'Solicitudes Recientes' }}</h5>
              <a routerLink="/solicitudes" class="btn-table-header">Ver todas</a>
            </div>
            <div class="table-container">
              <table class="table table-hover align-middle">
                <thead><tr><th>Institución</th><th>Municipio</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  @for (s of solicitudes(); track s.id) {
                    <tr>
                      <td>
                        <div class="d-flex align-items-center gap-3">
                          <div class="avatar-inst">{{ s.nombreInstitucion | iniciales }}</div>
                          <div>
                            <div class="fw-bold">{{ s.nombreInstitucion }}</div>
                            <small class="text-muted">{{ s.nombreRepresentante }}</small>
                          </div>
                        </div>
                      </td>
                      <td>{{ s.municipio }}</td>
                      <td><span [class]="s.estado | estadoBadge">{{ s.estado }}</span></td>
                      <td class="text-end"><a [routerLink]="['/solicitudes', s.id]" class="btn btn-outline-primary btn-sm">Ver</a></td>
                    </tr>
                  } @empty {
                    <tr><td colspan="4" class="text-center text-muted py-4">No hay solicitudes recientes</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-xl-6">
          <div class="card-table-section h-100">
            <div class="card-table-header">
              <h5 class="card-table-title">Actividades Recientes</h5>
              <a routerLink="/actividades" class="btn-table-header">Ver todas</a>
            </div>
            <div class="table-container">
              <table class="table table-hover align-middle">
                <thead><tr><th>Profesional</th><th>Municipio</th><th>Evaluación</th><th></th></tr></thead>
                <tbody>
                  @for (a of actividades(); track a.id) {
                    <tr>
                      <td>
                        <div class="fw-bold"><i class="ri-user-3-line text-primary me-1"></i>{{ a.profesionales || 'Sin asignar' }}</div>
                        <small class="text-muted">{{ a.fechaActividad | date: 'dd/MM/yyyy' }} · {{ a.nombreInstitucion || 'Sin institución' }}</small>
                      </td>
                      <td>{{ a.municipio }}</td>
                      <td><span [class]="a.estadoEvaluacion | estadoBadge">{{ a.estadoEvaluacion === 'Evaluada' ? 'Evaluada' : a.estadoEvaluacion === 'Cancelada' ? 'Cancelada' : 'Pendiente' }}</span></td>
                      <td class="text-end"><a [routerLink]="['/actividades', a.id]" class="btn btn-outline-primary btn-sm">Ver</a></td>
                    </tr>
                  } @empty {
                    <tr><td colspan="4" class="text-center text-muted py-4">No hay actividades recientes</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class DashboardComponent {
  readonly auth = inject(AuthService);
  private readonly service = inject(DashboardService);
  readonly cargando = signal(true);
  readonly kpis = signal<Kpi[]>([]);
  readonly solicitudes = signal<SolicitudReciente[]>([]);
  readonly actividades = signal<ActividadReciente[]>([]);

  constructor() {
    inject(Title).setTitle('Dashboard - Biblio Móvil');
    if (this.auth.hasRole('institucion')) {
      this.service.institucion().subscribe({
        next: (d) => {
          this.kpis.set([
            { label: 'Total Solicitudes', value: d.totalSolicitudes, icono: 'ri-file-list-3-line', color: 'bg-primary-subtle text-primary', link: '/solicitudes', linkText: 'Ver historial' },
            { label: 'Solicitudes Pendientes', value: d.solicitudesPendientes, icono: 'ri-time-line', color: 'bg-warning-subtle text-warning', link: '/solicitudes', linkText: 'Ver pendientes' },
            { label: 'Solicitudes Aprobadas', value: d.solicitudesAprobadas, icono: 'ri-checkbox-circle-line', color: 'bg-success-subtle text-success', link: '/solicitudes', linkText: 'Ver aprobadas' },
            { label: 'Actividades Registradas', value: d.totalActividades, icono: 'ri-calendar-check-line', color: 'bg-info-subtle text-info', link: '/actividades', linkText: 'Ver actividades' },
          ]);
          this.solicitudes.set(d.solicitudesRecientes);
          this.actividades.set(d.actividadesRecientes);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
    } else {
      this.service.admin().subscribe({
        next: (d) => {
          this.kpis.set([
            { label: 'Total Solicitudes', value: d.totalSolicitudes, icono: 'ri-file-list-3-line', color: 'bg-primary-subtle text-primary', link: '/solicitudes', linkText: 'Ver todas las solicitudes' },
            { label: 'Actividades Registradas', value: d.totalActividades, icono: 'ri-calendar-check-line', color: 'bg-success-subtle text-success', link: '/actividades', linkText: 'Ver todas las actividades' },
            { label: 'Evaluaciones', value: d.totalEvaluaciones, icono: 'ri-star-line', color: 'bg-warning-subtle text-warning', link: '/evaluaciones', linkText: 'Ver evaluaciones' },
            { label: 'Préstamos Activos', value: d.prestamosActivos, icono: 'ri-book-open-line', color: 'bg-info-subtle text-info', link: '/prestamos/admin', linkText: 'Consultar préstamos' },
          ]);
          this.solicitudes.set(d.solicitudesRecientes);
          this.actividades.set(d.actividadesRecientes);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
    }
  }
}
