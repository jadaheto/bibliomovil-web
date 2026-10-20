import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { ActividadDetalle, ActividadesService, badgeActividad, etiquetaEstadoActividad } from './actividades.service';
import { HoraPipe } from './hora.pipe';

/** `'…/foto.png'` → `true` si es imagen (miniatura); otro → botón "Descargar EXT". */
export function esImagen(url: string): boolean {
  return /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(url);
}

export function extension(url: string): string {
  const m = /\.([a-z0-9]+)(\?.*)?$/i.exec(url);
  return (m?.[1] ?? 'archivo').toUpperCase();
}

@Component({
  selector: 'app-actividad-detail',
  imports: [RouterLink, DatePipe, PageTitleComponent, LoadingComponent, HoraPipe],
  templateUrl: './actividad-detail.component.html',
})
export class ActividadDetailComponent {
  private readonly service = inject(ActividadesService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly id = input.required<string>();
  readonly actividad = signal<ActividadDetalle | null>(null);

  readonly rutaVolver = computed(() => (this.auth.hasRole('profesional') ? '/profesional/actividades' : '/actividades'));

  /** Profesional: su propia asignación está pendiente y la actividad sigue programada. */
  readonly puedeRegistrarEjecucion = computed(() => {
    const a = this.actividad();
    return !!a && this.auth.hasRole('profesional') && a.estadoEvaluacion === 'Pendiente' && a.asignaciones.some((x) => x.estado === 'Pendiente');
  });

  ngOnInit(): void {
    this.service.obtener(this.id()).subscribe({
      next: (a) => this.actividad.set(a),
      error: (err: ApiRequestError) => {
        this.alerts.error(err.status === 403 ? 'No tienes permiso para ver esta actividad.' : err.message);
        void this.router.navigate([this.rutaVolver()]);
      },
    });
  }

  badge(estado: string): string {
    return badgeActividad(estado);
  }

  etiqueta(estado: string): string {
    return etiquetaEstadoActividad(estado);
  }

  esImagen(url: string): boolean {
    return esImagen(url);
  }

  extension(url: string): string {
    return extension(url);
  }
}
