import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Paginated } from '../../shared/components/pagination.component';

export type EstadoSolicitud = 'Pendiente' | 'Aprobada' | 'Rechazada';

export const ESTADOS_SOLICITUD: EstadoSolicitud[] = ['Pendiente', 'Aprobada', 'Rechazada'];

export interface Solicitud {
  id: number;
  institucionId: number | null;
  institucionNombre: string | null;
  poliProteccionDatos: boolean;
  nombreInstitucion: string;
  nombreRepresentante: string;
  correo: string;
  telefono: string;
  objetivoEvento: string;
  numParticipantes: number;
  clasificacionPoblacion: string | null;
  ubicacionEvento: string;
  descEspacioFisico: string | null;
  responsableEvento: string | null;
  cargoResponsable: string | null;
  telefonoResponsable: string | null;
  entidadesVinculadas: string | null;
  observaciones: string | null;
  municipio: string;
  atencionDiscapacidad: boolean;
  tipoDiscapacidad: string | null;
  estado: EstadoSolicitud;
  motivoRechazo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrearSolicitud {
  poliProteccionDatos: boolean;
  nombreInstitucion: string;
  nombreRepresentante: string;
  correo: string;
  telefono: string;
  objetivoEvento: string;
  numParticipantes?: number;
  clasificacionPoblacion?: string;
  ubicacionEvento: string;
  descEspacioFisico?: string;
  responsableEvento?: string;
  cargoResponsable?: string;
  telefonoResponsable?: string;
  entidadesVinculadas?: string;
  observaciones?: string;
  municipio: string;
  atencionDiscapacidad?: boolean;
  tipoDiscapacidad?: string;
}

export interface SolicitudAprobada {
  id: number;
  institucionId: number | null;
  nombreInstitucion: string;
  institucionNombre: string | null;
  municipio: string;
  createdAt: string;
}

export interface EstadosDist {
  Pendiente: number;
  Aprobada: number;
  Rechazada: number;
}

export interface ReporteSolicitudes {
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  total: number;
  estadosDist: EstadosDist;
  solicitudes: Solicitud[];
}

export interface ConteoMes {
  anio: number;
  mes: number;
  mesNombre: string;
  total: number;
}

export interface EstadisticasSolicitudes {
  porMes: ConteoMes[];
  porEstado: { estado: EstadoSolicitud; total: number }[];
}

export interface FiltroSolicitudes {
  q?: string;
  estado?: EstadoSolicitud | '';
  page?: number;
  limit?: number;
}

/** Llamadas a `/solicitudes` (la institución solo ve las suyas; el servidor filtra). */
@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private readonly api = inject(ApiService);

  listar(filtro: FiltroSolicitudes): Observable<Paginated<Solicitud>> {
    return this.api.get<Paginated<Solicitud>>('solicitudes', { q: filtro.q, estado: filtro.estado, page: filtro.page ?? 1, limit: filtro.limit ?? 20 });
  }

  obtener(id: number | string): Observable<Solicitud> {
    return this.api.get<Solicitud>(`solicitudes/${id}`);
  }

  crear(datos: CrearSolicitud): Observable<Solicitud> {
    return this.api.post<Solicitud>('solicitudes', datos);
  }

  aprobar(id: number): Observable<Solicitud> {
    return this.api.patch<Solicitud>(`solicitudes/${id}/estado`, { accion: 'aprobar' });
  }

  rechazar(id: number, motivoRechazo: string): Observable<Solicitud> {
    return this.api.patch<Solicitud>(`solicitudes/${id}/estado`, { accion: 'rechazar', motivoRechazo });
  }

  aprobadasParaActividad(): Observable<SolicitudAprobada[]> {
    return this.api.get<SolicitudAprobada[]>('solicitudes/aprobadas-para-actividad');
  }

  reporte(fechaInicio: string, fechaFin: string): Observable<ReporteSolicitudes> {
    return this.api.get<ReporteSolicitudes>('solicitudes/reporte', { fechaInicio, fechaFin });
  }

  estadisticas(): Observable<EstadisticasSolicitudes> {
    return this.api.get<EstadisticasSolicitudes>('solicitudes/estadisticas');
  }
}
