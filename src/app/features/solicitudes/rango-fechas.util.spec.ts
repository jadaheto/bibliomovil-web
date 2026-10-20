import { fechaIso, rangoAtajo, validarRango } from './rango-fechas.util';

describe('rango-fechas.util', () => {
  const miercoles = new Date(2026, 9, 21); // 21/10/2026 (miércoles)

  it('formatea en local sin desfase', () => {
    expect(fechaIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('calcula los atajos', () => {
    expect(rangoAtajo('hoy', miercoles)).toEqual({ inicio: '2026-10-21', fin: '2026-10-21' });
    expect(rangoAtajo('semana', miercoles)).toEqual({ inicio: '2026-10-19', fin: '2026-10-21' });
    expect(rangoAtajo('mes', miercoles)).toEqual({ inicio: '2026-10-01', fin: '2026-10-21' });
    expect(rangoAtajo('mesAnterior', miercoles)).toEqual({ inicio: '2026-09-01', fin: '2026-09-30' });
  });

  it('la semana de un domingo arranca el lunes anterior', () => {
    expect(rangoAtajo('semana', new Date(2026, 9, 25))).toEqual({ inicio: '2026-10-19', fin: '2026-10-25' });
  });

  it('valida el rango', () => {
    expect(validarRango('', '2026-01-01')).toBe('Debe seleccionar ambas fechas.');
    expect(validarRango('2026-02-01', '2026-01-01')).toBe('La fecha de inicio no puede ser mayor que la fecha fin.');
    expect(validarRango('2026-01-01', '2026-01-31')).toBeNull();
  });
});
