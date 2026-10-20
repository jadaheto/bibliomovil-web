import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { Calificacion, Calificaciones, GRUPOS_CALIFICACION, colorPromedio, promedio1 } from './calificaciones';
import { EvaluacionesService, ResumenPeriodo, TipoPeriodo } from './evaluaciones.service';

/** Vista imprimible "Resumen Mensual/Trimestral de Evaluaciones" (administrador). */
@Component({
  selector: 'app-evaluaciones-resumen',
  imports: [RouterLink, DatePipe, DecimalPipe, PageTitleComponent, LoadingComponent],
  templateUrl: './evaluaciones-resumen.component.html',
})
export class EvaluacionesResumenComponent {
  private readonly service = inject(EvaluacionesService);
  private readonly alerts = inject(AlertService);
  readonly tipo = input<string>();
  readonly mesInicio = input<string>();
  readonly mesFin = input<string>();
  readonly anio = input<string>();

  readonly grupos = GRUPOS_CALIFICACION;
  readonly datos = signal<ResumenPeriodo | null>(null);
  readonly cargando = signal(true);
  readonly generado = new Date();

  ngOnInit(): void {
    this.service
      .resumenPeriodo({
        tipo: (this.tipo() as TipoPeriodo | undefined) ?? undefined,
        mesInicio: this.mesInicio() ? Number(this.mesInicio()) : undefined,
        mesFin: this.mesFin() ? Number(this.mesFin()) : undefined,
        anio: this.anio() ? Number(this.anio()) : undefined,
      })
      .subscribe({
        next: (d) => {
          this.datos.set(d);
          this.cargando.set(false);
        },
        error: (err: ApiRequestError) => {
          this.alerts.error(err.message);
          this.cargando.set(false);
        },
      });
  }

  titulo(d: ResumenPeriodo): string {
    return d.tipo === 'trimestral' ? 'Resumen Trimestral de Evaluaciones' : 'Resumen Mensual de Evaluaciones';
  }

  valor(p: Calificaciones | undefined, key: Calificacion): number {
    return p?.[key] ?? 0;
  }

  promedio(v: number | null | undefined): string {
    return promedio1(v);
  }

  color(v: number): string {
    return colorPromedio(v);
  }

  porcentaje(v: number): number {
    return Math.max(0, Math.min(100, (v / 5) * 100));
  }

  imprimir(): void {
    window.print();
  }
}
