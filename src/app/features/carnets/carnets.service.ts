import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Paginated } from '../../shared/components/pagination.component';

/** Catálogos del backend (`modules/carnets/domain/carnet.ts`). */
export const TIPOS_PERSONA_CARNET = ['docente', 'estudiante'] as const;
export type TipoPersonaCarnet = (typeof TIPOS_PERSONA_CARNET)[number];

export const TIPOS_IDENTIFICACION: { value: string; label: string }[] = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'RC', label: 'Registro Civil' },
  { value: 'PE', label: 'Permiso Especial' },
  { value: 'DNI', label: 'Documento Nacional de Identidad' },
];

export const JORNADAS = ['Mañana', 'Tarde', 'Nocturna'] as const;

/** Mismo orden que el selector del administrador en el sistema original. */
export const ESTADOS_CARNET = ['Pendiente', 'Activo', 'Rechazado', 'Suspendido', 'Vencido', 'Cancelado'] as const;
export type EstadoCarnet = (typeof ESTADOS_CARNET)[number];

export interface Carnet {
  id: number;
  institucionId: number | null;
  institucionNombre: string | null;
  tipoPersona: TipoPersonaCarnet;
  nombres: string;
  apellidos: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  correo: string | null;
  telefono: string | null;
  area: string | null;
  cargo: string | null;
  grado: string | null;
  edad: number | null;
  jornada: string | null;
  acudiente: string | null;
  telefonoAcudiente: string | null;
  estado: EstadoCarnet;
  codigoCarnet: string | null;
  fechaSolicitud: string;
  fechaAprobacion: string | null;
  fechaVencimiento: string;
  vigenciaDias: number;
  observaciones: string | null;
  createdAt: string;
}

/** Datos públicos (destino del QR), sin información de contacto. */
export interface CarnetPublico {
  id: number;
  tipoPersona: TipoPersonaCarnet;
  nombres: string;
  apellidos: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  estado: EstadoCarnet;
  vigenciaDias: number;
  fechaSolicitud: string;
  fechaVencimiento: string;
  codigoCarnet: string | null;
  institucionNombre: string | null;
  urlVerificacion: string;
  qrDataUrl: string;
}

/** Subconjunto necesario para pintar la vista previa del carnet. */
export type CarnetPreviewDatos = Pick<
  Carnet,
  'tipoPersona' | 'nombres' | 'apellidos' | 'tipoIdentificacion' | 'numeroIdentificacion' | 'estado' | 'vigenciaDias' | 'fechaSolicitud' | 'fechaVencimiento'
>;

export interface RegistrarCarnetInput {
  tipoPersona: TipoPersonaCarnet;
  nombres: string;
  apellidos: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  correo?: string;
  telefono?: string;
  area?: string;
  cargo?: string;
  grado?: string;
  edad?: number;
  jornada?: string;
  acudiente?: string;
  telefonoAcudiente?: string;
  observaciones?: string;
  institucionId?: number;
}

export interface FiltrosCarnets {
  estado?: string;
  q?: string;
}

export function tipoPersonaLabel(tipo: string | null | undefined): 'Docente' | 'Estudiante' {
  return (tipo ?? '').toLowerCase() === 'docente' ? 'Docente' : 'Estudiante';
}

/** Badge de los listados (`Rechazado` y `Cancelado` comparten etiqueta, como en el original). */
export function badgeCarnet(estado: string | null | undefined): { clase: string; texto: string } {
  switch (estado) {
    case 'Pendiente':
      return { clase: 'bg-warning', texto: 'Pendiente' };
    case 'Activo':
      return { clase: 'bg-success', texto: 'Activo' };
    case 'Rechazado':
    case 'Cancelado':
      return { clase: 'bg-danger', texto: 'Rechazado' };
    case 'Suspendido':
      return { clase: 'bg-secondary', texto: 'Suspendido' };
    case 'Vencido':
      return { clase: 'bg-dark', texto: 'Vencido' };
    default:
      return { clase: 'bg-secondary', texto: estado || 'Pendiente' };
  }
}

/** Chip de estado dentro de la tarjeta (verde / ámbar / gris / oscuro / rojo). */
export function chipEstadoCarnet(estado: string | null | undefined): 'ok' | 'warn' | 'secondary' | 'dark' | 'err' {
  switch ((estado ?? 'Pendiente').toLowerCase()) {
    case 'activo':
      return 'ok';
    case 'pendiente':
      return 'warn';
    case 'suspendido':
      return 'secondary';
    case 'vencido':
      return 'dark';
    default:
      return 'err';
  }
}

export function etiquetaTipoIdentificacion(valor: string | null | undefined): string {
  return TIPOS_IDENTIFICACION.find((t) => t.value === valor)?.label ?? valor ?? '';
}

@Injectable({ providedIn: 'root' })
export class CarnetsService {
  private readonly api = inject(ApiService);

  registrar(datos: RegistrarCarnetInput): Observable<Carnet> {
    return this.api.post<Carnet>('carnets', datos);
  }

  historial(filtros: FiltrosCarnets, page: number, limit = 20): Observable<Paginated<Carnet>> {
    return this.api.get<Paginated<Carnet>>('carnets', { estado: filtros.estado, q: filtros.q, page, limit });
  }

  obtener(id: number | string): Observable<Carnet> {
    return this.api.get<Carnet>(`carnets/${id}`);
  }

  /** Verificación pública (sin sesión): datos del carnet + QR en data URL. */
  verificar(id: number | string): Observable<CarnetPublico> {
    return this.api.get<CarnetPublico>(`carnets/verificar/${id}`);
  }

  eliminar(id: number | string): Observable<void> {
    return this.api.delete<void>(`carnets/${id}`);
  }

  adminListar(filtros: FiltrosCarnets, page: number, limit = 20): Observable<Paginated<Carnet>> {
    return this.api.get<Paginated<Carnet>>('admin/carnets', { estado: filtros.estado, q: filtros.q, page, limit });
  }

  adminCambiarEstado(id: number | string, estado: EstadoCarnet): Observable<Carnet> {
    return this.api.patch<Carnet>(`admin/carnets/${id}/estado`, { estado });
  }
}
