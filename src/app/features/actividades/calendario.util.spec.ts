import { EventoCalendario } from './actividades.service';
import { construirGrilla, desplazarMes, ordenarEventos } from './calendario.util';
import { formatearHora } from './hora.pipe';

const evento = (id: number, start: string): EventoCalendario => ({
  id,
  title: 'Eje',
  start,
  color: '#f7b84b',
  extendedProps: { profesionales: 'Juan', municipio: 'Sincelejo', estado: 'Pendiente', institucion: 'IE', descripcionActividad: 'Act' },
});

describe('calendario.util', () => {
  it('construye la grilla de octubre 2026 empezando en lunes', () => {
    const semanas = construirGrilla(2026, 10, [], new Date(2026, 9, 21));
    // 1/10/2026 es jueves → 3 celdas de relleno (lun, mar, mié) de septiembre
    expect(semanas.length).toBe(5);
    expect(semanas[0].map((d) => d.dia)).toEqual([28, 29, 30, 1, 2, 3, 4]);
    expect(semanas[0][0].delMes).toBe(false);
    expect(semanas[0][3].delMes).toBe(true);
    expect(semanas[0][3].fecha).toBe('2026-10-01');
    expect(semanas[4][6].fecha).toBe('2026-11-01');
    expect(semanas[4][6].delMes).toBe(false);
    const hoy = semanas.flat().find((d) => d.hoy);
    expect(hoy?.fecha).toBe('2026-10-21');
  });

  it('agrupa los eventos por fecha', () => {
    const semanas = construirGrilla(2026, 10, [evento(1, '2026-10-23'), evento(2, '2026-10-23'), evento(3, '2026-10-02')]);
    const dias = semanas.flat();
    expect(dias.find((d) => d.fecha === '2026-10-23')?.eventos.map((e) => e.id)).toEqual([1, 2]);
    expect(dias.find((d) => d.fecha === '2026-10-02')?.eventos.length).toBe(1);
    expect(dias.find((d) => d.fecha === '2026-10-03')?.eventos.length).toBe(0);
  });

  it('un mes que empieza en lunes no tiene relleno inicial y completa 6 semanas si hace falta', () => {
    const junio = construirGrilla(2026, 6, []); // 1/6/2026 es lunes, 30 días → 5 semanas
    expect(junio[0][0].fecha).toBe('2026-06-01');
    expect(junio.length).toBe(5);
    const agosto = construirGrilla(2026, 8, []); // 1/8/2026 es sábado, 31 días → 6 semanas
    expect(agosto.length).toBe(6);
    expect(agosto.every((s) => s.length === 7)).toBe(true);
  });

  it('desplaza meses cruzando el año', () => {
    expect(desplazarMes(2026, 12, 1)).toEqual({ anio: 2027, mes: 1 });
    expect(desplazarMes(2026, 1, -1)).toEqual({ anio: 2025, mes: 12 });
  });

  it('ordena los eventos por fecha', () => {
    expect(ordenarEventos([evento(2, '2026-10-23'), evento(1, '2026-10-02')]).map((e) => e.id)).toEqual([1, 2]);
  });

  it('formatea horas en 12 horas', () => {
    expect(formatearHora('09:00:00')).toBe('9:00 AM');
    expect(formatearHora('14:30')).toBe('2:30 PM');
    expect(formatearHora('00:15:00')).toBe('12:15 AM');
    expect(formatearHora('12:00:00')).toBe('12:00 PM');
    expect(formatearHora(null)).toBe('-');
  });
});
