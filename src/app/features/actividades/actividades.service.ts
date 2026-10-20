import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Paginated } from '../../shared/components/pagination.component';

/** `Pendiente` se muestra como "Programada" en la interfaz. */
export type EstadoActividad = 'Pendiente' | 'Evaluada' | 'Cancelada';
export const ESTADOS_ACTIVIDAD: EstadoActividad[] = ['Pendiente', 'Evaluada', 'Cancelada'];

export type EstadoAsignacion = 'Pendiente' | 'Completado';

export interface ProfesionalAsignado {
  profesionalId: number;
  nombreCompleto: string;
  cargo: string;
  estado: EstadoAsignacion;
}

export interface SolicitudVinculada {
  id: number;
  institucionId: number | null;
  nombreInstitucion: string;
  institucionNombre: string | null;
  responsableEvento: string | null;
  cargoResponsable: string | null;
  telefonoResponsable: string | null;
  numParticipantes: number;
  municipio: string;
}

export interface Actividad {
  id: number;
  solicitudId: number;
  creadoPor: number | null;
  nombreInstitucion: string | null;
  institucionVisible: string;
  /** `YYYY-MM-DD` */
  fechaActividad: string;
  /** `HH:MM:SS` */
  horaInicio: string | null;
  horaFinalizacion: string | null;
  municipio: string;
  tipoInstitucion: string;
  ejeMensual: string;
  estrategiaInstitucional: string;
  descripcionActividad: string;
  objetivoEspecifico: string;
  numTotalParticipantes: number;
  poblacionAtendida: string | null;
  personaDiscapacidadSino: boolean;
  tipoDiscapacidad: string | null;
  lugar: string | null;
  estadoEvaluacion: EstadoActividad;
  motivoCancelacion: string | null;
  fechaCancelacion: string | null;
  solicitud: SolicitudVinculada | null;
  profesionales: ProfesionalAsignado[];
  createdAt: string;
  updatedAt: string;
}

export interface Asignacion {
  id: number;
  profesionalId: number;
  profesionalNombre: string;
  profesionalCargo: string;
  estado: EstadoAsignacion;
  resultados: string | null;
  impactoPercibido: string | null;
  dificultades: string | null;
  propuestasMejora: string | null;
  observaciones: string | null;
  personaDiscapacidadSino: boolean | null;
  tipoDiscapacidad: string | null;
  /** URLs públicas absolutas */
  evidencias: string[];
  updatedAt: string;
}

export interface ActividadDetalle extends Actividad {
  /** El profesional solo recibe su propia asignación. */
  asignaciones: Asignacion[];
}

export interface CrearActividad {
  solicitudId: number;
  fechaActividad: string;
  horaInicio?: string;
  horaFinalizacion?: string;
  ejeMensual: string;
  profesionalIds: number[];
  municipio: string;
  tipoInstitucion: string;
  estrategiaInstitucional: string;
  descripcionActividad: string;
  objetivoEspecifico: string;
  numTotalParticipantes: number;
  poblacionAtendida?: string;
  personaDiscapacidadSino?: boolean;
  tipoDiscapacidad?: string;
}

export interface EventoCalendario {
  id: number;
  /** Eje mensual */
  title: string;
  /** `YYYY-MM-DD` */
  start: string;
  color: string;
  extendedProps: {
    profesionales: string;
    municipio: string;
    estado: EstadoActividad;
    institucion: string;
    descripcionActividad: string;
  };
}

export interface ActividadDelDia {
  id: number;
  hora: string;
  institucion: string;
  municipio: string;
  participantes: number;
  responsable: string | null;
  contacto: string | null;
  estado: EstadoActividad;
  descripcionActividad: string;
  profesionales: string;
}

export interface CalendarioMensual {
  mes: number;
  anio: number;
  mesNombre: string;
  total: number;
  diasConActividades: number;
  dias: { dia: number; actividades: ActividadDelDia[] }[];
}

export interface ResultadoProfesional {
  asignacionId: number;
  actividadId: number;
  fechaActividad: string;
  municipio: string;
  tituloActividad: string;
  tipoInstitucion: string;
  nombreInstitucion: string | null;
  profesionalNombre: string;
  profesionalCargo: string;
  resultados: string | null;
  impactoPercibido: string | null;
  dificultades: string | null;
  propuestasMejora: string | null;
  observaciones: string | null;
  evidencias: string[];
  fechaResultado: string;
}

export interface EstadisticasActividades {
  totalActividades: number;
  porMes: { anio: number; mes: number; mesNombre: string; total: number }[];
  resultadosPorProfesional: ResultadoProfesional[];
}

export interface ProfesionalActivo {
  id: number;
  nombreCompleto: string;
  cargo: string;
  municipioBase: string | null;
}

export interface FiltroActividades {
  mes?: number | '';
  anio?: number | '';
  estado?: EstadoActividad | '';
  page?: number;
  limit?: number;
}

export interface Reprogramacion {
  fechaActividad: string;
  horaInicio?: string;
  horaFinalizacion?: string;
}

/** Llamadas a `/actividades` y al listado de profesionales activos. */
@Injectable({ providedIn: 'root' })
export class ActividadesService {
  private readonly api = inject(ApiService);

  listar(filtro: FiltroActividades): Observable<Paginated<Actividad>> {
    return this.api.get<Paginated<Actividad>>('actividades', {
      mes: filtro.mes || undefined,
      anio: filtro.anio || undefined,
      estado: filtro.estado || undefined,
      page: filtro.page ?? 1,
      limit: filtro.limit ?? 20,
    });
  }

  misActividades(page = 1, estado?: EstadoActividad | '', limit = 20): Observable<Paginated<Actividad>> {
    return this.api.get<Paginated<Actividad>>('actividades/mis-actividades', { page, limit, estado: estado || undefined });
  }

  obtener(id: number | string): Observable<ActividadDetalle> {
    return this.api.get<ActividadDetalle>(`actividades/${id}`);
  }

  crear(datos: CrearActividad): Observable<ActividadDetalle> {
    return this.api.post<ActividadDetalle>('actividades', datos);
  }

  calendario(mes: number, anio: number): Observable<EventoCalendario[]> {
    return this.api.get<EventoCalendario[]>('actividades/calendario', { mes, anio });
  }

  calendarioMensual(mes?: number | string, anio?: number | string): Observable<CalendarioMensual> {
    return this.api.get<CalendarioMensual>('actividades/calendario-mensual', { mes, anio });
  }

  estadisticas(): Observable<EstadisticasActividades> {
    return this.api.get<EstadisticasActividades>('actividades/estadisticas');
  }

  registrarEjecucion(id: number | string, datos: FormData): Observable<ActividadDetalle> {
    return this.api.post<ActividadDetalle>(`actividades/${id}/ejecucion`, datos);
  }

  reprogramar(id: number, datos: Reprogramacion): Observable<ActividadDetalle> {
    return this.api.patch<ActividadDetalle>(`actividades/${id}/reprogramar`, datos);
  }

  cancelar(id: number, motivoCancelacion: string): Observable<ActividadDetalle> {
    return this.api.patch<ActividadDetalle>(`actividades/${id}/cancelar`, { motivoCancelacion });
  }

  profesionalesActivos(): Observable<ProfesionalActivo[]> {
    return this.api.get<ProfesionalActivo[]>('profesionales/activos');
  }
}

/** Etiqueta visible del estado (`Pendiente` → "Programada"). */
export function etiquetaEstadoActividad(estado: EstadoActividad | string): string {
  return estado === 'Pendiente' ? 'Programada' : estado;
}

/** Clase de badge de estado de actividad (Evaluada verde, Cancelada roja, resto ámbar). */
export function badgeActividad(estado: EstadoActividad | string): string {
  if (estado === 'Evaluada') return 'badge bg-success';
  if (estado === 'Cancelada') return 'badge bg-danger';
  return 'badge bg-warning';
}
