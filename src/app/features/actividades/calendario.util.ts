import { EventoCalendario } from './actividades.service';

export interface DiaGrilla {
  /** `YYYY-MM-DD` */
  fecha: string;
  dia: number;
  /** Pertenece al mes mostrado (los demás son relleno de la semana). */
  delMes: boolean;
  hoy: boolean;
  eventos: EventoCalendario[];
}

export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

function iso(anio: number, mes0: number, dia: number): string {
  const d = new Date(anio, mes0, dia);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Grilla mensual (semanas que empiezan en lunes) con los eventos agrupados por fecha.
 * `mes` va de 1 a 12. Siempre devuelve semanas completas de 7 días.
 */
export function construirGrilla(anio: number, mes: number, eventos: EventoCalendario[], hoy: Date = new Date()): DiaGrilla[][] {
  const mes0 = mes - 1;
  const porFecha = new Map<string, EventoCalendario[]>();
  for (const e of eventos) {
    const clave = e.start.slice(0, 10);
    porFecha.set(clave, [...(porFecha.get(clave) ?? []), e]);
  }
  const hoyIso = iso(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const primero = new Date(anio, mes0, 1);
  const desplazamiento = (primero.getDay() + 6) % 7; // lunes = 0
  const diasEnMes = new Date(anio, mes0 + 1, 0).getDate();
  const totalCeldas = Math.ceil((desplazamiento + diasEnMes) / 7) * 7;

  const semanas: DiaGrilla[][] = [];
  for (let i = 0; i < totalCeldas; i++) {
    const diaRelativo = i - desplazamiento + 1; // puede ser <= 0 o > diasEnMes
    const fecha = iso(anio, mes0, diaRelativo);
    const celda: DiaGrilla = {
      fecha,
      dia: Number(fecha.slice(8, 10)),
      delMes: diaRelativo >= 1 && diaRelativo <= diasEnMes,
      hoy: fecha === hoyIso,
      eventos: porFecha.get(fecha) ?? [],
    };
    if (i % 7 === 0) semanas.push([]);
    semanas[semanas.length - 1].push(celda);
  }
  return semanas;
}

/** Mes anterior/siguiente conservando el rango 1..12. */
export function desplazarMes(anio: number, mes: number, delta: number): { anio: number; mes: number } {
  const d = new Date(anio, mes - 1 + delta, 1);
  return { anio: d.getFullYear(), mes: d.getMonth() + 1 };
}

/** Eventos del mes ordenados por fecha (vista "Lista"). */
export function ordenarEventos(eventos: EventoCalendario[]): EventoCalendario[] {
  return [...eventos].sort((a, b) => a.start.localeCompare(b.start) || a.id - b.id);
}
