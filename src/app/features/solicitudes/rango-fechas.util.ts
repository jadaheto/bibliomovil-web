/** Utilidades puras de fechas para los atajos del modal "Descargar solicitudes". */

export interface RangoFechas {
  inicio: string;
  fin: string;
}

/** `Date` → `YYYY-MM-DD` en hora local (sin desfase UTC). */
export function fechaIso(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export type AtajoRango = 'hoy' | 'semana' | 'mes' | 'mesAnterior';

/** Rango correspondiente a los atajos Hoy / Esta semana (lunes→hoy) / Este mes / Mes anterior. */
export function rangoAtajo(atajo: AtajoRango, hoy: Date = new Date()): RangoFechas {
  const h = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  switch (atajo) {
    case 'hoy':
      return { inicio: fechaIso(h), fin: fechaIso(h) };
    case 'semana': {
      const lunes = new Date(h);
      lunes.setDate(h.getDate() - ((h.getDay() + 6) % 7));
      return { inicio: fechaIso(lunes), fin: fechaIso(h) };
    }
    case 'mes':
      return { inicio: fechaIso(new Date(h.getFullYear(), h.getMonth(), 1)), fin: fechaIso(h) };
    case 'mesAnterior':
      return {
        inicio: fechaIso(new Date(h.getFullYear(), h.getMonth() - 1, 1)),
        fin: fechaIso(new Date(h.getFullYear(), h.getMonth(), 0)),
      };
  }
}

/** Mensaje de validación del rango (mismos textos del sistema original) o `null` si es válido. */
export function validarRango(inicio: string, fin: string): string | null {
  if (!inicio || !fin) return 'Debe seleccionar ambas fechas.';
  if (inicio > fin) return 'La fecha de inicio no puede ser mayor que la fecha fin.';
  return null;
}
