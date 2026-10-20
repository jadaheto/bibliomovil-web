import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import QRCode from 'qrcode';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { PaginatedMeta, PaginationComponent } from '../../shared/components/pagination.component';
import { Actividad, ActividadesService, badgeActividad, etiquetaEstadoActividad } from './actividades.service';
import { HoraPipe } from './hora.pipe';

/** URL pública de evaluación que se codifica en el QR. */
export function urlEvaluacion(id: number, origin: string = location.origin): string {
  return `${origin}/evaluar/actividad/${id}`;
}

/** "Mis Actividades" del profesional: listado con QR, reprogramación y cancelación. */
@Component({
  selector: 'app-mis-actividades',
  imports: [FormsModule, RouterLink, DatePipe, PageTitleComponent, LoadingComponent, PaginationComponent, ModalComponent, HoraPipe],
  templateUrl: './mis-actividades.component.html',
})
export class MisActividadesComponent {
  private readonly service = inject(ActividadesService);
  private readonly alerts = inject(AlertService);

  readonly items = signal<Actividad[]>([]);
  readonly meta = signal<PaginatedMeta | null>(null);
  readonly cargando = signal(true);
  readonly procesando = signal(false);

  readonly qrActividad = signal<Actividad | null>(null);
  readonly qrDataUrl = signal<string | null>(null);
  readonly qrUrl = signal('');

  readonly reprogramar = signal<Actividad | null>(null);
  readonly cancelar = signal<Actividad | null>(null);

  fechaActividad = '';
  horaInicio = '';
  horaFinalizacion = '';
  motivoCancelacion = '';
  formTocado = false;

  constructor() {
    this.cargar(1);
  }

  cargar(page: number): void {
    this.cargando.set(true);
    this.service.misActividades(page).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.meta.set(res.meta);
        this.cargando.set(false);
      },
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message);
        this.cargando.set(false);
      },
    });
  }

  badge(estado: string): string {
    return badgeActividad(estado);
  }

  etiqueta(estado: string): string {
    return etiquetaEstadoActividad(estado);
  }

  /** Oculta "Registrar Ejecución" cuando la propia asignación ya está completada. */
  puedeRegistrar(a: Actividad): boolean {
    return a.estadoEvaluacion === 'Pendiente' && !a.profesionales.some((p) => p.estado === 'Completado' && this.esMiAsignacion(a, p.profesionalId));
  }

  private esMiAsignacion(a: Actividad, profesionalId: number): boolean {
    // `mis-actividades` solo devuelve actividades donde el usuario está asignado; si hay una sola
    // asignación completada es la suya. Con varias, el backend expone el detalle por asignación.
    return a.profesionales.length === 1 || a.profesionales.every((p) => p.profesionalId === profesionalId);
  }

  async abrirQr(a: Actividad): Promise<void> {
    const url = urlEvaluacion(a.id);
    this.qrUrl.set(url);
    this.qrDataUrl.set(null);
    this.qrActividad.set(a);
    try {
      this.qrDataUrl.set(await QRCode.toDataURL(url, { width: 250, margin: 1, errorCorrectionLevel: 'H' }));
    } catch {
      this.alerts.error('No fue posible generar el código QR.');
    }
  }

  abrirReprogramar(a: Actividad): void {
    this.fechaActividad = a.fechaActividad;
    this.horaInicio = (a.horaInicio ?? '').slice(0, 5);
    this.horaFinalizacion = (a.horaFinalizacion ?? '').slice(0, 5);
    this.formTocado = false;
    this.reprogramar.set(a);
  }

  confirmarReprogramar(event: Event): void {
    event.preventDefault();
    this.formTocado = true;
    const a = this.reprogramar();
    if (!a || !this.fechaActividad) return;
    this.procesando.set(true);
    this.service
      .reprogramar(a.id, { fechaActividad: this.fechaActividad, horaInicio: this.horaInicio || undefined, horaFinalizacion: this.horaFinalizacion || undefined })
      .subscribe({
        next: () => {
          this.procesando.set(false);
          this.reprogramar.set(null);
          this.alerts.success('Actividad reprogramada correctamente.');
          this.cargar(this.meta()?.page ?? 1);
        },
        error: (err: ApiRequestError) => {
          this.procesando.set(false);
          this.reprogramar.set(null);
          this.alerts.error(err.message || 'No fue posible reprogramar la actividad.');
        },
      });
  }

  abrirCancelar(a: Actividad): void {
    this.motivoCancelacion = '';
    this.formTocado = false;
    this.cancelar.set(a);
  }

  confirmarCancelar(event: Event): void {
    event.preventDefault();
    this.formTocado = true;
    const a = this.cancelar();
    const motivo = this.motivoCancelacion.trim();
    if (!a || !motivo) return;
    this.procesando.set(true);
    this.service.cancelar(a.id, motivo).subscribe({
      next: () => {
        this.procesando.set(false);
        this.cancelar.set(null);
        this.alerts.success('Actividad cancelada correctamente.');
        this.cargar(this.meta()?.page ?? 1);
      },
      error: (err: ApiRequestError) => {
        this.procesando.set(false);
        this.cancelar.set(null);
        this.alerts.error(err.message || 'No fue posible cancelar la actividad.');
      },
    });
  }
}
