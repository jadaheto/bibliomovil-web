import { ERROR_TRIMESTRAL, parametrosPeriodo, validarPeriodo } from './periodo.util';

describe('periodo.util', () => {
  const anio = new Date().getFullYear();

  it('el mensual solo exige mes y año válidos', () => {
    expect(validarPeriodo('mensual', 5, 5, anio)).toBeNull();
    expect(validarPeriodo('mensual', 13, 5, anio)).toBe('Mes inválido.');
    expect(validarPeriodo('mensual', 5, 5, 1999)).toBe('Año inválido.');
    expect(validarPeriodo('mensual', 5, 5, anio + 2)).toBe('Año inválido.');
  });

  it('el trimestral exige exactamente 3 meses consecutivos', () => {
    expect(validarPeriodo('trimestral', 5, 7, anio)).toBeNull();
    expect(validarPeriodo('trimestral', 5, 6, anio)).toBe(ERROR_TRIMESTRAL);
    expect(validarPeriodo('trimestral', 7, 5, anio)).toBe(ERROR_TRIMESTRAL);
    expect(validarPeriodo('trimestral', 1, 3, anio)).toBeNull();
  });

  it('en el mensual el mes fin es igual al mes inicio', () => {
    expect(parametrosPeriodo('mensual', 3, 9, anio)).toEqual({ tipo: 'mensual', mesInicio: 3, mesFin: 3, anio });
    expect(parametrosPeriodo('trimestral', 3, 5, anio)).toEqual({ tipo: 'trimestral', mesInicio: 3, mesFin: 5, anio });
  });
});
