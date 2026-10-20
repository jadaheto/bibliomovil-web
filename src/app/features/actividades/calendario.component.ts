import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { MESES } from '../../shared/constants/catalogos';
import { TitlecaseEsPipe } from '../../shared/pipes/titlecase-es.pipe';
import { ActividadesService, EventoCalendario, badgeActividad, etiquetaEstadoActividad } from './actividades.service';
import { DIAS_SEMANA, construirGrilla, desplazarMes, ordenarEventos } from './calendario.util';

/** Calendario mensual de actividades (réplica del FullCalendar del sistema original, sin librerías). */
@Component({
  selector: 'app-calendario',
  imports: [FormsModule, RouterLink, DatePipe, PageTitleComponent, LoadingComponent, ModalComponent, TitlecaseEsPipe],
  templateUrl: './calendario.component.html',
  styles: [
    `
      .cal-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); border-left: 1px solid var(--vz-border-color, #e9ebec); border-top: 1px solid var(--vz-border-color, #e9ebec); }
      .cal-head { padding: 0.5rem 0.25rem; text-align: center; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; background: #f8f9fa; border-right: 1px solid #e9ebec; border-bottom: 1px solid #e9ebec; }
      .cal-cell { min-height: 110px; padding: 0.25rem; border-right: 1px solid #e9ebec; border-bottom: 1px solid #e9ebec; background: #fff; }
      .cal-cell.fuera { background: #fafbfc; color: #adb5bd; }
      .cal-cell.hoy { background: #fff8e6; }
      .cal-dia { font-size: 0.8rem; font-weight: 600; text-align: right; padding: 0 0.25rem; }
      .cal-evento { display: block; width: 100%; border: 0; border-radius: 4px; color: #fff; font-size: 0.72rem; text-align: left; padding: 2px 6px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
      @media (max-width: 767px) { .cal-cell { min-height: 60px; } .cal-evento { font-size: 0; height: 10px; padding: 0; } }
    `,
  ],
})
export class CalendarioComponent {
  readonly auth = inject(AuthService);
  private readonly service = inject(ActividadesService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);

  readonly meses = MESES;
  readonly diasSemana = DIAS_SEMANA;
  readonly anio = signal(new Date().getFullYear());
  readonly mes = signal(new Date().getMonth() + 1);
  readonly eventos = signal<EventoCalendario[]>([]);
  readonly cargando = signal(true);
  readonly vista = signal<'mes' | 'lista'>('mes');
  readonly seleccionado = signal<EventoCalendario | null>(null);
  readonly modalPdf = signal(false);

  readonly titulo = computed(() => `${MESES[this.mes() - 1]} ${this.anio()}`);
  readonly semanas = computed(() => construirGrilla(this.anio(), this.mes(), this.eventos()));
  readonly lista = computed(() => ordenarEventos(this.eventos()));
  readonly anios = (() => {
    const actual = new Date().getFullYear();
    const lista: number[] = [];
    for (let a = actual + 2; a >= actual - 5; a--) lista.push(a);
    return lista;
  })();

  pdfMes = new Date().getMonth() + 1;
  pdfAnio = new Date().getFullYear();

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.calendario(this.mes(), this.anio()).subscribe({
      next: (eventos) => {
        this.eventos.set(eventos);
        this.cargando.set(false);
      },
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message);
        this.cargando.set(false);
      },
    });
  }

  mover(delta: number): void {
    const { anio, mes } = desplazarMes(this.anio(), this.mes(), delta);
    this.anio.set(anio);
    this.mes.set(mes);
    this.cargar();
  }

  hoy(): void {
    const d = new Date();
    this.anio.set(d.getFullYear());
    this.mes.set(d.getMonth() + 1);
    this.cargar();
  }

  etiqueta(estado: string): string {
    return etiquetaEstadoActividad(estado);
  }

  badge(estado: string): string {
    return badgeActividad(estado);
  }

  descargarPdf(event: Event): void {
    event.preventDefault();
    this.modalPdf.set(false);
    void this.router.navigate(['/actividades/calendario-mensual'], { queryParams: { mes: this.pdfMes, anio: this.pdfAnio } });
  }
}
