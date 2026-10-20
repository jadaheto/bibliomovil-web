import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ApiRequestError } from '../../core/api/api.service';
import { FieldErrorComponent } from '../../shared/components/field-error.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { marcarTodoTocado } from '../../shared/forms/form.utils';
import { CALIFICACIONES, Calificacion, Calificaciones, ESCALA_PUBLICA, GRUPOS_CALIFICACION } from './calificaciones';
import { ActividadPublica, EvaluacionesService } from './evaluaciones.service';

/** Página pública de evaluación (URL del QR), sin sesión. */
@Component({
  selector: 'app-evaluar-publico',
  imports: [ReactiveFormsModule, LoadingComponent, FieldErrorComponent],
  templateUrl: './evaluar-publico.component.html',
})
export class EvaluarPublicoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EvaluacionesService);

  readonly id = input.required<string>();
  readonly grupos = GRUPOS_CALIFICACION;
  readonly escala = ESCALA_PUBLICA;
  readonly actividad = signal<ActividadPublica | null>(null);
  readonly cargando = signal(true);
  readonly errorCarga = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly errorEnvio = signal<string | null>(null);
  readonly enviada = signal(false);

  readonly form = this.fb.nonNullable.group({
    actividadMasSignificativa: ['', Validators.required],
    tematicasSugeridas: ['', Validators.required],
    comentariosSugerenciasGenerales: ['', Validators.required],
    ...(Object.fromEntries(CALIFICACIONES.map((c) => [c, [5]])) as Record<Calificacion, [number]>),
  });

  constructor() {
    inject(Title).setTitle('Evaluar Actividad - Biblio Móvil');
  }

  ngOnInit(): void {
    this.service.actividadPublica(this.id()).subscribe({
      next: (a) => {
        this.actividad.set(a);
        this.cargando.set(false);
      },
      error: (err: ApiRequestError) => {
        this.errorCarga.set(err.status === 404 ? 'Actividad no encontrada' : err.message);
        this.cargando.set(false);
      },
    });
  }

  get cancelada(): boolean {
    return this.actividad()?.estado === 'Cancelada';
  }

  control(key: Calificacion): FormControl<number> {
    return this.form.controls[key];
  }

  enviar(): void {
    if (this.form.invalid) {
      marcarTodoTocado(this.form);
      return;
    }
    this.enviando.set(true);
    this.errorEnvio.set(null);
    const v = this.form.getRawValue();
    const calificaciones = Object.fromEntries(CALIFICACIONES.map((c) => [c, Number(v[c])])) as Calificaciones;
    this.service
      .evaluarPublico(this.id(), {
        ...calificaciones,
        actividadMasSignificativa: v.actividadMasSignificativa.trim(),
        tematicasSugeridas: v.tematicasSugeridas.trim(),
        comentariosSugerenciasGenerales: v.comentariosSugerenciasGenerales.trim(),
      })
      .subscribe({
        next: (res) => {
          if (res?.actividad) this.actividad.set(res.actividad);
          this.enviada.set(true);
          this.enviando.set(false);
          window.scrollTo({ top: 0 });
        },
        error: (err: ApiRequestError) => {
          this.errorEnvio.set(err.details?.join(' ') ?? err.message);
          this.enviando.set(false);
        },
      });
  }
}
