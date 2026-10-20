import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Paginated } from '../../shared/components/pagination.component';

/** Estados reales en BD (`modules/prestamos/domain/prestamo.ts`). */
export const ESTADOS_PRESTAMO = ['Activo', 'Libros entregados', 'Devuelto', 'Con retraso', 'Perdido'] as const;
export type EstadoPrestamo = (typeof ESTADOS_PRESTAMO)[number];

export const TIPOS_PERSONA_PRESTAMO = ['Docente', 'Estudiante', 'Institucion'] as const;
export type PersonaTipoPrestamo = (typeof TIPOS_PERSONA_PRESTAMO)[number];

export type AccionPrestamo = 'libros_entregados' | 'devolucion';

export interface Prestamo {
  id: number;
  libroId: number;
  libroTitulo: string | null;
  libroAutor: string | null;
  institucionId: number | null;
  institucionNombre: string | null;
  registradoPor: number | null;
  personaTipo: PersonaTipoPrestamo;
  personaNombre: string;
  personaEmail: string | null;
  personaId: string | null;
  fechaPrestamo: string;
  fechaLimiteDevolucion: string;
  fechaDevolucion: string | null;
  estado: EstadoPrestamo;
  vencido: boolean;
  observaciones: string | null;
  profesionalResponsable: string | null;
  createdAt: string;
}

export interface ResumenPrestamos {
  activos: number;
  porDevolver: number;
  devueltos: number;
  historialTotal: number;
}

export interface MisPrestamos {
  hoy: string;
  resumen: ResumenPrestamos;
  activos: Prestamo[];
  historial: Prestamo[];
}

export interface SolicitarPrestamoInput {
  libroId: number;
  personaTipo: PersonaTipoPrestamo;
  personaNombre: string;
  personaId: string;
  personaEmail: string;
  fechaLimiteDevolucion: string;
  observaciones?: string;
}

export interface FiltrosPrestamosAdmin {
  estado?: string;
  q?: string;
}

export interface OpcionEstadoPrestamo {
  value: AccionPrestamo;
  label: string;
}

/**
 * Opciones del selector "cambiar estado" del administrador, según el estado actual
 * (mismas etiquetas que `prestamos/admin_prestamos.php`).
 */
export function opcionesEstadoPrestamo(estado: string): { placeholder: string | null; opciones: OpcionEstadoPrestamo[] } {
  switch (estado) {
    case 'Activo':
      return {
        placeholder: 'Seleccione...',
        opciones: [
          { value: 'libros_entregados', label: 'Libros entregados' },
          { value: 'devolucion', label: 'Devolución' },
        ],
      };
    case 'Libros entregados':
      return {
        placeholder: null,
        opciones: [
          { value: 'libros_entregados', label: 'Libros entregados (actual)' },
          { value: 'devolucion', label: 'Devolución' },
        ],
      };
    case 'Devuelto':
      return {
        placeholder: 'Cambiar a...',
        opciones: [
          { value: 'devolucion', label: 'Devolución (actual)' },
          { value: 'libros_entregados', label: 'Reabrir como Libros entregados' },
        ],
      };
    default:
      return {
        placeholder: null,
        opciones: [
          { value: 'libros_entregados', label: 'Libros entregados' },
          { value: 'devolucion', label: 'Devolución' },
        ],
      };
  }
}

/** Badge del listado del administrador (`Activo` → "No entregado"). */
export function badgePrestamoAdmin(p: Pick<Prestamo, 'estado'>): { clase: string; texto: string } {
  switch (p.estado) {
    case 'Activo':
      return { clase: 'bg-warning', texto: 'No entregado' };
    case 'Devuelto':
      return { clase: 'bg-success', texto: 'Devuelto' };
    case 'Libros entregados':
      return { clase: 'bg-info', texto: 'Libros entregados' };
    case 'Perdido':
      return { clase: 'bg-danger', texto: 'Perdido' };
    default:
      return { clase: 'bg-secondary', texto: p.estado };
  }
}

/** Badge del historial de la institución (`Activo` vigente → "Libros no entregados"). */
export function badgePrestamoInstitucion(p: Pick<Prestamo, 'estado' | 'vencido'>): { clase: string; texto: string } {
  switch (p.estado) {
    case 'Devuelto':
      return { clase: 'bg-success', texto: 'Devuelto' };
    case 'Libros entregados':
      return { clase: 'bg-info', texto: 'Libros entregados' };
    case 'Perdido':
      return { clase: 'bg-danger', texto: 'Perdido' };
    case 'Activo':
      return p.vencido ? { clase: 'bg-warning', texto: 'Vencido' } : { clase: 'bg-primary', texto: 'Libros no entregados' };
    default:
      return { clase: 'bg-secondary', texto: p.estado };
  }
}

/** Un préstamo puede devolverse mientras el ejemplar siga fuera de la biblioteca. */
export function puedeDevolverse(p: Pick<Prestamo, 'estado'>): boolean {
  return p.estado === 'Activo' || p.estado === 'Libros entregados';
}

@Injectable({ providedIn: 'root' })
export class PrestamosService {
  private readonly api = inject(ApiService);

  misPrestamos(): Observable<MisPrestamos> {
    return this.api.get<MisPrestamos>('prestamos/mis-prestamos');
  }

  solicitar(datos: SolicitarPrestamoInput): Observable<Prestamo> {
    return this.api.post<Prestamo>('prestamos', datos);
  }

  admin(filtros: FiltrosPrestamosAdmin, page: number, limit = 20): Observable<Paginated<Prestamo>> {
    return this.api.get<Paginated<Prestamo>>('prestamos/admin', { estado: filtros.estado, q: filtros.q, page, limit });
  }

  obtener(id: number | string): Observable<Prestamo> {
    return this.api.get<Prestamo>(`prestamos/${id}`);
  }

  cambiarEstado(id: number | string, accion: AccionPrestamo): Observable<Prestamo> {
    return this.api.patch<Prestamo>(`prestamos/${id}/estado`, { accion });
  }

  devolver(id: number | string): Observable<Prestamo> {
    return this.api.patch<Prestamo>(`prestamos/${id}/devolver`, {});
  }
}
