import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { MESES } from '../../shared/constants/catalogos';
import { promedio1 } from './calificaciones';
import { EvaluacionesService, ResumenActividadEvaluada, TipoPeriodo } from './evaluaciones.service';
import { parametrosPeriodo, validarPeriodo } from './periodo.util';

@Component({
  selector: 'app-evaluaciones-list',
  imports: [FormsModule, RouterLink, DatePipe, PageTitleComponent, LoadingComponent, ModalComponent],
  templateUrl: './evaluaciones-list.component.html',
  styles: ['.form-check-input[type=radio] { border-radius: 50% !important; }'],
})
export class EvaluacionesListComponent {
  readonly auth = inject(AuthService);
  private readonly service = inject(EvaluacionesService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);

  readonly meses = MESES;
  readonly anios = (() => {
    const actual = new Date().getFullYear();
    const lista: number[] = [];
    for (let a = actual; a >= actual - 5; a--) lista.push(a);
    return lista;
  })();
  readonly items = signal<ResumenActividadEvaluada[]>([]);
  readonly cargando = signal(true);
  readonly modalDescarga = signal(false);
  readonly errorPeriodo = signal<string | null>(null);

  tipo: TipoPeriodo = 'mensual';
  mesInicio = new Date().getMonth() + 1;
  mesFin = new Date().getMonth() + 1;
  anio = new Date().getFullYear();

  constructor() {
    this.service.listar().subscribe({
      next: (lista) => {
        this.items.set(lista);
        this.cargando.set(false);
      },
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message);
        this.cargando.set(false);
      },
    });
  }

  promedio(valor: number): string {
    return promedio1(valor);
  }

  abrirDescarga(): void {
    this.errorPeriodo.set(null);
    this.modalDescarga.set(true);
  }

  descargar(event: Event): void {
    event.preventDefault();
    const error = validarPeriodo(this.tipo, Number(this.mesInicio), Number(this.mesFin), Number(this.anio));
    this.errorPeriodo.set(error);
    if (error) return;
    this.modalDescarga.set(false);
    void this.router.navigate(['/evaluaciones/resumen'], { queryParams: parametrosPeriodo(this.tipo, Number(this.mesInicio), Number(this.mesFin), Number(this.anio)) });
  }
}
