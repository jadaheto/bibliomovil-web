import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../api/api.service';

export interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  url: string | null;
  leida: boolean;
  createdAt: string;
}

/** Iconos y colores por tipo (equivalentes a la campana del sistema original). */
export const NOTIFICACION_ESTILO: Record<string, { icono: string; color: string }> = {
  institucion_registrada: { icono: 'ri-building-2-line', color: 'bg-primary-subtle text-primary' },
  solicitud_creada: { icono: 'ri-file-list-3-line', color: 'bg-info-subtle text-info' },
  solicitud_resuelta: { icono: 'ri-file-list-3-line', color: 'bg-info-subtle text-info' },
  actividad_programada: { icono: 'ri-calendar-event-line', color: 'bg-success-subtle text-success' },
  actividad_asignada: { icono: 'ri-calendar-check-line', color: 'bg-success-subtle text-success' },
  prestamo_registrado: { icono: 'ri-book-read-line', color: 'bg-warning-subtle text-warning' },
  carnet_registrado: { icono: 'ri-id-card-line', color: 'bg-danger-subtle text-danger' },
  carnet_actualizado: { icono: 'ri-id-card-line', color: 'bg-danger-subtle text-danger' },
};

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly api = inject(ApiService);
  readonly count = signal(0);
  readonly recientes = signal<Notificacion[]>([]);

  cargarContador(): Observable<{ count: number }> {
    return this.api.get<{ count: number }>('notificaciones/contador').pipe(tap((r) => this.count.set(r.count)));
  }

  cargarRecientes(): Observable<Notificacion[]> {
    return this.api.get<Notificacion[]>('notificaciones', { limit: 10 }).pipe(tap((list) => this.recientes.set(list)));
  }

  marcarLeida(id: number): Observable<Notificacion> {
    return this.api.patch<Notificacion>(`notificaciones/${id}/leida`).pipe(
      tap(() => {
        this.recientes.update((list) => list.filter((n) => n.id !== id));
        this.count.update((c) => Math.max(0, c - 1));
      }),
    );
  }

  marcarTodasLeidas(): Observable<{ ok: boolean; marcadas: number }> {
    return this.api.patch<{ ok: boolean; marcadas: number }>('notificaciones/marcar-todas-leidas').pipe(
      tap(() => {
        this.recientes.set([]);
        this.count.set(0);
      }),
    );
  }

  /** "Hace unos segundos", "Hace N min", "Hace N h" o fecha completa. */
  tiempoRelativo(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (Number.isNaN(diff)) return 'Sin fecha';
    if (diff < 60) return 'Hace unos segundos';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
