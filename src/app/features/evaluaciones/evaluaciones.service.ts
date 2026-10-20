import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Calificaciones } from './calificaciones';

export interface ResumenActividadEvaluada {
  actividadId: number;
  descripcionActividad: string | null;
  nombreInstitucion: string | null;
  fechaActividad: string | null;
  totalEvaluaciones: number;
  promedioGeneral: number;
}

export interface ActividadEvaluada {
  id: number;
  descripcionActividad: string;
  nombreInstitucion: string | null;
  municipio: string;
  fechaActividad: string;
}

export interface RespuestaAbierta {
  evaluacionId: number;
  edadParticipante: number | null;
  actividadMasSignificativa: string | null;
  tematicasSugeridas: string | null;
  comentariosSugerenciasGenerales: string | null;
  fechaEvaluacion: string;
}

export interface DetalleEvaluacionActividad {
  totalEvaluaciones: number;
  promedios: Calificaciones;
  promedioGeneral: number;
  actividad: ActividadEvaluada;
  respuestasAbiertas: RespuestaAbierta[];
}

export interface EvaluacionInterna extends Calificaciones {
  actividadId: number;
  edadParticipante?: number;
  actividadMasSignificativa?: string;
  tematicasSugeridas?: string;
  comentariosSugerenciasGenerales?: string;
}

export interface EvaluacionPublica extends Calificaciones {
  edadParticipante?: number;
  actividadMasSignificativa: string;
  tematicasSugeridas: string;
  comentariosSugerenciasGenerales: string;
}

export interface ActividadPublica {
  id: number;
  descripcionActividad: string;
  fechaActividad: string;
  nombreInstitucion: string;
  estado: 'Pendiente' | 'Evaluada' | 'Cancelada';
}

export interface EvaluacionPublicaRegistrada {
  mensaje: string;
  actividad: ActividadPublica;
  evaluacionId: number;
}

export type TipoPeriodo = 'mensual' | 'trimestral';

export interface ResumenPeriodoQuery {
  tipo: TipoPeriodo;
  mesInicio: number;
  mesFin: number;
  anio: number;
}

export interface ResumenActividadPeriodo {
  actividad: ActividadEvaluada;
  totalEvaluaciones: number;
  promedios: Calificaciones;
  promedioGeneral: number;
}

export interface ResumenPeriodo {
  tipo: TipoPeriodo;
  periodo: string;
  anio: number;
  mesInicio: number;
  mesFin: number;
  promediosGlobales: { totalEvaluaciones: number; totalActividades: number; promedios: Calificaciones; promedioGeneral: number };
  detallePorActividad: ResumenActividadPeriodo[];
  respuestasAbiertas: (RespuestaAbierta & { actividad: ActividadEvaluada })[];
}

/** Llamadas a `/evaluaciones` (internas) y `/evaluar` (público por QR). */
@Injectable({ providedIn: 'root' })
export class EvaluacionesService {
  private readonly api = inject(ApiService);

  listar(): Observable<ResumenActividadEvaluada[]> {
    return this.api.get<ResumenActividadEvaluada[]>('evaluaciones');
  }

  detalle(actividadId: number | string): Observable<DetalleEvaluacionActividad> {
    return this.api.get<DetalleEvaluacionActividad>(`evaluaciones/actividad/${actividadId}`);
  }

  crear(datos: EvaluacionInterna): Observable<unknown> {
    return this.api.post('evaluaciones', datos);
  }

  resumenPeriodo(q: Partial<ResumenPeriodoQuery>): Observable<ResumenPeriodo> {
    return this.api.get<ResumenPeriodo>('evaluaciones/resumen-periodo', { tipo: q.tipo, mesInicio: q.mesInicio, mesFin: q.mesFin, anio: q.anio });
  }

  actividadPublica(id: number | string): Observable<ActividadPublica> {
    return this.api.get<ActividadPublica>(`evaluar/actividad/${id}`);
  }

  evaluarPublico(id: number | string, datos: EvaluacionPublica): Observable<EvaluacionPublicaRegistrada> {
    return this.api.post<EvaluacionPublicaRegistrada>(`evaluar/actividad/${id}`, datos);
  }
}
