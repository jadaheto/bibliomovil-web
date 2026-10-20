import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';

export interface SolicitudReciente {
  id: number;
  nombreInstitucion: string;
  nombreRepresentante: string;
  municipio: string;
  estado: string;
  createdAt: string;
}

export interface ActividadReciente {
  id: number;
  fechaActividad: string;
  municipio: string;
  estadoEvaluacion: string;
  nombreInstitucion: string | null;
  profesionales: string;
}

export interface DashboardAdmin {
  totalSolicitudes: number;
  totalActividades: number;
  totalEvaluaciones: number;
  totalInstituciones: number;
  totalLibros: number;
  prestamosActivos: number;
  solicitudesPorEstado: { Pendiente: number; Aprobada: number; Rechazada: number };
  solicitudesRecientes: SolicitudReciente[];
  actividadesRecientes: ActividadReciente[];
  actividadesPorMes: { anio: number; mes: number; total: number }[];
}

export interface DashboardInstitucion {
  totalSolicitudes: number;
  solicitudesPendientes: number;
  solicitudesAprobadas: number;
  solicitudesRechazadas: number;
  totalActividades: number;
  prestamosActivos: number;
  totalCarnets: number;
  solicitudesRecientes: SolicitudReciente[];
  actividadesRecientes: ActividadReciente[];
}

export interface DashboardProfesional {
  actividadesProgramadas: number;
  actividadesEjecutadas: number;
  municipiosVisitados: string[];
  totalParticipantes: number;
  actividadesRecientes: {
    id: number;
    fechaActividad: string;
    nombreInstitucion: string | null;
    municipio: string;
    estadoEvaluacion: string;
    estadoAsignacion: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  admin(): Observable<DashboardAdmin> {
    return this.api.get<DashboardAdmin>('dashboard/admin');
  }
  institucion(): Observable<DashboardInstitucion> {
    return this.api.get<DashboardInstitucion>('dashboard/institucion');
  }
  profesional(): Observable<DashboardProfesional> {
    return this.api.get<DashboardProfesional>('actividades/dashboard-profesional');
  }
}
