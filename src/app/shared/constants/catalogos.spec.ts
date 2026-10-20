import { MUNICIPIOS_SUCRE, badgeEstado, iniciales, normalizar } from './catalogos';

describe('catálogos y utilidades', () => {
  it('contiene los 26 municipios de Sucre', () => {
    expect(MUNICIPIOS_SUCRE).toHaveLength(26);
    expect(MUNICIPIOS_SUCRE[0]).toBe('Corozal');
    expect(MUNICIPIOS_SUCRE).toContain('San Luis de Sincé');
  });

  it('badgeEstado asigna los colores del sistema original', () => {
    expect(badgeEstado('Aprobada')).toBe('bg-success');
    expect(badgeEstado('Rechazada')).toBe('bg-danger');
    expect(badgeEstado('Pendiente')).toBe('bg-warning');
    expect(badgeEstado('Libros entregados')).toBe('bg-info');
    expect(badgeEstado('inactiva')).toBe('bg-secondary');
    expect(badgeEstado(undefined)).toBe('bg-secondary');
  });

  it('iniciales y normalizar', () => {
    expect(iniciales('Institución Educativa San José')).toBe('IE');
    expect(iniciales('')).toBe('?');
    expect(normalizar('Sincé')).toBe('since');
  });
});
