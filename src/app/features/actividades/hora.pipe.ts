import { Pipe, PipeTransform } from '@angular/core';

/** `'14:30:00'` → `'2:30 PM'` (formato `h:i A` del sistema original); vacío → `'-'`. */
export function formatearHora(hora: string | null | undefined): string {
  if (!hora) return '-';
  const m = /^(\d{1,2}):(\d{2})/.exec(hora);
  if (!m) return hora;
  const h24 = Number(m[1]);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m[2]} ${h24 < 12 ? 'AM' : 'PM'}`;
}

@Pipe({ name: 'hora' })
export class HoraPipe implements PipeTransform {
  transform(hora: string | null | undefined): string {
    return formatearHora(hora);
  }
}
