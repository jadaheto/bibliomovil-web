import { formatearTamano, validarEvidencias } from './evidencias.util';

describe('evidencias.util', () => {
  it('exige al menos un archivo', () => {
    expect(validarEvidencias([])).toBe('Debe adjuntar al menos una evidencia.');
  });

  it('limita a 10 archivos', () => {
    const muchos = Array.from({ length: 11 }, (_, i) => ({ name: `f${i}.png`, size: 10 }));
    expect(validarEvidencias(muchos)).toBe('Puede subir máximo 10 archivos.');
  });

  it('rechaza formatos no permitidos y archivos de más de 10 MB', () => {
    expect(validarEvidencias([{ name: 'virus.exe', size: 1 }])).toContain('no es un formato permitido');
    expect(validarEvidencias([{ name: 'grande.pdf', size: 10 * 1024 * 1024 + 1 }])).toContain('supera el tamaño máximo');
  });

  it('acepta imágenes, PDF y Word dentro del límite', () => {
    expect(validarEvidencias([{ name: 'a.JPG', size: 500 }, { name: 'b.docx', size: 1024 }, { name: 'c.pdf', size: 10 * 1024 * 1024 }])).toBeNull();
  });

  it('formatea tamaños', () => {
    expect(formatearTamano(512)).toBe('512 B');
    expect(formatearTamano(1536)).toBe('1.5 KB');
    expect(formatearTamano(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});
