import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { AlertService } from '../../core/ui/alert.service';
import { FieldErrorComponent } from '../../shared/components/field-error.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { MUNICIPIOS_SUCRE } from '../../shared/constants/catalogos';
import { marcarTodoTocado } from '../../shared/forms/form.utils';
import { SolicitudAprobada, SolicitudesService } from '../solicitudes/solicitudes.service';
import { ActividadesService, CrearActividad, ProfesionalActivo } from './actividades.service';

/** Formulario "Registrar Nueva Actividad" (administrador y profesional). */
@Component({
  selector: 'app-actividad-form',
  imports: [ReactiveFormsModule, RouterLink, PageTitleComponent, FieldErrorComponent],
  templateUrl: './actividad-form.component.html',
})
export class ActividadFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ActividadesService);
  private readonly solicitudes = inject(SolicitudesService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);
  readonly auth = inject(AuthService);

  /** `?solicitudId=N` preselecciona la solicitud. */
  readonly solicitudId = input<string>();

  readonly municipios = MUNICIPIOS_SUCRE;
  readonly solicitudesAprobadas = signal<SolicitudAprobada[]>([]);
  readonly profesionales = signal<ProfesionalActivo[]>([]);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    solicitudId: ['', Validators.required],
    fechaActividad: ['', Validators.required],
    horaInicio: ['', Validators.required],
    horaFinalizacion: ['', Validators.required],
    ejeMensual: ['', [Validators.required, Validators.maxLength(255)]],
    profesionalIds: [[] as number[], Validators.required],
    municipio: ['', Validators.required],
    tipoInstitucion: ['', [Validators.required, Validators.maxLength(255)]],
    estrategiaInstitucional: ['', [Validators.required, Validators.maxLength(255)]],
    descripcionActividad: ['', Validators.required],
    objetivoEspecifico: ['', Validators.required],
    numTotalParticipantes: [null as number | null, [Validators.required, Validators.min(1)]],
    poblacionAtendida: ['', Validators.required],
    personaDiscapacidadSino: ['', Validators.required],
    tipoDiscapacidad: ['', Validators.maxLength(255)],
  });

  ngOnInit(): void {
    this.solicitudes.aprobadasParaActividad().subscribe({
      next: (lista) => {
        this.solicitudesAprobadas.set(lista);
        const pre = this.solicitudId();
        if (pre && lista.some((s) => String(s.id) === pre)) {
          this.form.controls.solicitudId.setValue(pre);
          this.alSeleccionarSolicitud(pre);
        }
      },
      error: (err: ApiRequestError) => this.alerts.error(err.message),
    });
    this.service.profesionalesActivos().subscribe({
      next: (lista) => this.profesionales.set(lista),
      error: (err: ApiRequestError) => this.alerts.error(err.message),
    });
  }

  get atiendeDiscapacidad(): boolean {
    return this.form.controls.personaDiscapacidadSino.value === '1';
  }

  etiquetaSolicitud(s: SolicitudAprobada): string {
    return `${s.institucionNombre ?? s.nombreInstitucion ?? 'Sin nombre'} - ${s.municipio}`;
  }

  /** Rellena el municipio con el de la solicitud si aún no se eligió uno. */
  alSeleccionarSolicitud(id: string): void {
    const s = this.solicitudesAprobadas().find((x) => String(x.id) === id);
    if (s && !this.form.controls.municipio.value) this.form.controls.municipio.setValue(s.municipio);
  }

  /** Actualiza `profesionalIds` desde el `<select multiple>`. */
  cambiarProfesionales(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const ids = Array.from(select.selectedOptions).map((o) => Number(o.value));
    this.form.controls.profesionalIds.setValue(ids);
    this.form.controls.profesionalIds.markAsDirty();
  }

  estaSeleccionado(id: number): boolean {
    return this.form.controls.profesionalIds.value.includes(id);
  }

  guardar(): void {
    if (this.form.invalid) {
      marcarTodoTocado(this.form);
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const datos: CrearActividad = {
      solicitudId: Number(v.solicitudId),
      fechaActividad: v.fechaActividad,
      horaInicio: v.horaInicio || undefined,
      horaFinalizacion: v.horaFinalizacion || undefined,
      ejeMensual: v.ejeMensual.trim(),
      profesionalIds: v.profesionalIds,
      municipio: v.municipio,
      tipoInstitucion: v.tipoInstitucion.trim(),
      estrategiaInstitucional: v.estrategiaInstitucional.trim(),
      descripcionActividad: v.descripcionActividad.trim(),
      objetivoEspecifico: v.objetivoEspecifico.trim(),
      numTotalParticipantes: Number(v.numTotalParticipantes),
      poblacionAtendida: v.poblacionAtendida.trim() || undefined,
      personaDiscapacidadSino: v.personaDiscapacidadSino === '1',
      tipoDiscapacidad: v.personaDiscapacidadSino === '1' && v.tipoDiscapacidad.trim() ? v.tipoDiscapacidad.trim() : undefined,
    };
    this.service.crear(datos).subscribe({
      next: (a) => {
        this.alerts.success(`Actividad guardada correctamente. Profesionales asignados: ${a.profesionales?.length ?? datos.profesionalIds.length}`);
        void this.router.navigate([this.auth.hasRole('profesional') ? '/profesional/actividades' : '/actividades']);
      },
      error: (err: ApiRequestError) => {
        this.error.set(err.details?.join(' ') ?? err.message);
        this.guardando.set(false);
      },
    });
  }
}
