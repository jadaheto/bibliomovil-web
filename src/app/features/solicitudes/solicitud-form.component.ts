import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { AlertService } from '../../core/ui/alert.service';
import { FieldErrorComponent } from '../../shared/components/field-error.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { MUNICIPIOS_SUCRE } from '../../shared/constants/catalogos';
import { marcarTodoTocado } from '../../shared/forms/form.utils';
import { CrearSolicitud, SolicitudesService } from './solicitudes.service';

export const URL_CONDICIONES_ESPACIO = 'https://www.comfasucre.com.co/wp-content/uploads/2026/07/CONDICIONES_UBICACION.jpg.jpeg';

/** Formulario "Nueva Solicitud de Servicio" (mismos campos y etiquetas del sistema original). */
@Component({
  selector: 'app-solicitud-form',
  imports: [ReactiveFormsModule, RouterLink, PageTitleComponent, FieldErrorComponent],
  templateUrl: './solicitud-form.component.html',
})
export class SolicitudFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(SolicitudesService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);
  readonly auth = inject(AuthService);

  readonly municipios = MUNICIPIOS_SUCRE;
  readonly urlCondiciones = URL_CONDICIONES_ESPACIO;
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    poliProteccionDatos: [false, Validators.requiredTrue],
    nombreInstitucion: ['', [Validators.required, Validators.maxLength(255)]],
    nombreRepresentante: ['', [Validators.required, Validators.maxLength(255)]],
    correo: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.maxLength(50)]],
    objetivoEvento: ['', Validators.required],
    numParticipantes: [null as number | null, Validators.min(1)],
    municipio: ['', Validators.required],
    atencionDiscapacidad: ['No' as 'No' | 'Si', Validators.required],
    tipoDiscapacidad: ['', Validators.maxLength(255)],
    clasificacionPoblacion: [''],
    ubicacionEvento: ['', Validators.required],
    descEspacioFisico: [''],
    responsableEvento: ['', [Validators.required, Validators.maxLength(255)]],
    cargoResponsable: ['', Validators.maxLength(255)],
    telefonoResponsable: ['', Validators.maxLength(50)],
    entidadesVinculadas: [''],
    observaciones: [''],
  });

  /** Nombre de la institución del usuario (bloquea el campo, el backend lo sobreescribe). */
  readonly institucionBloqueada = signal(false);

  constructor() {
    const nombre = this.auth.current()?.institucionNombre;
    if (this.auth.hasRole('institucion') && nombre) {
      this.form.controls.nombreInstitucion.setValue(nombre);
      this.form.controls.nombreInstitucion.disable();
      this.institucionBloqueada.set(true);
    } else if (this.auth.hasRole('institucion')) {
      this.auth.refreshCurrent().subscribe({
        next: (me) => {
          if (me.institucionNombre) {
            this.form.controls.nombreInstitucion.setValue(me.institucionNombre);
            this.form.controls.nombreInstitucion.disable();
            this.institucionBloqueada.set(true);
          }
        },
        error: () => undefined,
      });
    }
  }

  get atiendeDiscapacidad(): boolean {
    return this.form.controls.atencionDiscapacidad.value === 'Si';
  }

  enviar(): void {
    if (this.form.invalid) {
      marcarTodoTocado(this.form);
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const limpio = (s: string) => (s.trim() ? s.trim() : undefined);
    const datos: CrearSolicitud = {
      poliProteccionDatos: v.poliProteccionDatos,
      nombreInstitucion: v.nombreInstitucion.trim(),
      nombreRepresentante: v.nombreRepresentante.trim(),
      correo: v.correo.trim(),
      telefono: v.telefono.trim(),
      objetivoEvento: v.objetivoEvento.trim(),
      numParticipantes: v.numParticipantes ? Number(v.numParticipantes) : undefined,
      clasificacionPoblacion: limpio(v.clasificacionPoblacion),
      ubicacionEvento: v.ubicacionEvento.trim(),
      descEspacioFisico: limpio(v.descEspacioFisico),
      responsableEvento: limpio(v.responsableEvento),
      cargoResponsable: limpio(v.cargoResponsable),
      telefonoResponsable: limpio(v.telefonoResponsable),
      entidadesVinculadas: limpio(v.entidadesVinculadas),
      observaciones: limpio(v.observaciones),
      municipio: v.municipio,
      atencionDiscapacidad: v.atencionDiscapacidad === 'Si',
      tipoDiscapacidad: v.atencionDiscapacidad === 'Si' ? limpio(v.tipoDiscapacidad) : undefined,
    };
    this.service.crear(datos).subscribe({
      next: () => {
        this.alerts.success('Solicitud enviada correctamente.');
        void this.router.navigate(['/solicitudes']);
      },
      error: (err: ApiRequestError) => {
        this.error.set(err.details?.join(' ') ?? err.message);
        this.guardando.set(false);
      },
    });
  }
}
