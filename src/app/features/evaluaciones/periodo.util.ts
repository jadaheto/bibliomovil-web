import { TipoPeriodo } from './evaluaciones.service';

export const ERROR_TRIMESTRAL = 'El reporte trimestral debe cubrir exactamente 3 meses consecutivos (ej. Mayo a Julio).';

/**
 * Validación del modal "Descargar resumen de evaluaciones" (misma que el JS del sistema original).
 * Devuelve el mensaje de error o `null`.
 */
export function validarPeriodo(tipo: TipoPeriodo, mesInicio: number, mesFin: number, anio: number): string | null {
  const actual = new Date().getFullYear();
  if (!(mesInicio >= 1 && mesInicio <= 12) || !(mesFin >= 1 && mesFin <= 12)) return 'Mes inválido.';
  if (anio < 2000 || anio > actual + 1) return 'Año inválido.';
  if (tipo === 'mensual') return null;
  if (mesFin - mesInicio !== 2) return ERROR_TRIMESTRAL;
  return null;
}

/** Parámetros efectivos para la API (en el mensual `mesFin = mesInicio`). */
export function parametrosPeriodo(tipo: TipoPeriodo, mesInicio: number, mesFin: number, anio: number) {
  return { tipo, mesInicio, mesFin: tipo === 'mensual' ? mesInicio : mesFin, anio };
}
