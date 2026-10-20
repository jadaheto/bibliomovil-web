import { DatePipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { FieldErrorComponent } from '../../shared/components/field-error.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { marcarTodoTocado } from '../../shared/forms/form.utils';
import { ActividadDetalle, ActividadesService } from './actividades.service';
import { formatearTamano, validarEvidencias } from './evidencias.util';

/** Formulario "Registrar Ejecución de Actividad" (profesional asignado). */
@Component({
  selector: 'app-registrar-ejecucion',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, PageTitleComponent, LoadingComponent, FieldErrorComponent],
  templateUrl: './registrar-ejecucion.component.html',
})
export class RegistrarEjecucionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ActividadesService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  readonly id = input.required<string>();
  readonly actividad = signal<ActividadDetalle | null>(null);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly archivos = signal<File[]>([]);
  readonly errorArchivos = signal<string | null>(null);
  readonly archivosTocados = signal(false);

  readonly form = this.fb.nonNullable.group({
    resultados: ['', Validators.required],
    impactoPercibido: ['', Validators.required],
    dificultades: ['', Validators.required],
    propuestasMejora: ['', Validators.required],
    observaciones: [''],
    personaDiscapacidadSino: ['', Validators.required],
    tipoDiscapacidad: ['', Validators.maxLength(255)],
  });

  ngOnInit(): void {
    this.service.obtener(this.id()).subscribe({
      next: (a) => {
        this.actividad.set(a);
        this.cargando.set(false);
      },
      error: (err: ApiRequestError) => {
        this.alerts.error(err.status === 404 ? 'Actividad no encontrada.' : err.message);
        void this.router.navigate(['/profesional/actividades']);
      },
    });
  }

  get cancelada(): boolean {
    return this.actividad()?.estadoEvaluacion === 'Cancelada';
  }

  get yaCompletada(): boolean {
    const a = this.actividad();
    return !!a && a.asignaciones.length > 0 && a.asignaciones.every((x) => x.estado === 'Completado');
  }

  get atiendeDiscapacidad(): boolean {
    return this.form.controls.personaDiscapacidadSino.value === '1';
  }

  seleccionarArchivos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const lista = Array.from(input.files ?? []);
    this.archivos.set(lista);
    this.archivosTocados.set(true);
    this.errorArchivos.set(validarEvidencias(lista));
  }

  quitarArchivo(indice: number): void {
    const lista = this.archivos().filter((_, i) => i !== indice);
    this.archivos.set(lista);
    this.errorArchivos.set(validarEvidencias(lista));
  }

  tamano(bytes: number): string {
    return formatearTamano(bytes);
  }

  guardar(): void {
    this.archivosTocados.set(true);
    const errorArchivos = validarEvidencias(this.archivos());
    this.errorArchivos.set(errorArchivos);
    if (this.form.invalid || errorArchivos) {
      marcarTodoTocado(this.form);
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const fd = new FormData();
    fd.append('resultados', v.resultados.trim());
    fd.append('impactoPercibido', v.impactoPercibido.trim());
    fd.append('dificultades', v.dificultades.trim());
    fd.append('propuestasMejora', v.propuestasMejora.trim());
    if (v.observaciones.trim()) fd.append('observaciones', v.observaciones.trim());
    fd.append('personaDiscapacidadSino', v.personaDiscapacidadSino === '1' ? 'true' : 'false');
    if (v.personaDiscapacidadSino === '1' && v.tipoDiscapacidad.trim()) fd.append('tipoDiscapacidad', v.tipoDiscapacidad.trim());
    for (const f of this.archivos()) fd.append('evidencias', f, f.name);

    this.service.registrarEjecucion(this.id(), fd).subscribe({
      next: () => {
        this.alerts.success('Ejecución registrada exitosamente.');
        void this.router.navigate(['/profesional/actividades']);
      },
      error: (err: ApiRequestError) => {
        this.error.set(err.details?.join(' ') ?? err.message);
        this.guardando.set(false);
      },
    });
  }
}
