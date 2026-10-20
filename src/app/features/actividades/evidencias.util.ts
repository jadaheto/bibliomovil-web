/** Reglas de las evidencias de ejecución (mismas del backend: 10 archivos, 10 MB cada uno). */
export const MAX_EVIDENCIAS = 10;
export const MAX_EVIDENCIA_BYTES = 10 * 1024 * 1024;
export const EXTENSIONES_EVIDENCIA = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'];

export interface ArchivoResumen {
  name: string;
  size: number;
}

/** Devuelve el mensaje de error o `null` si la selección es válida. */
export function validarEvidencias(archivos: ArchivoResumen[]): string | null {
  if (!archivos.length) return 'Debe adjuntar al menos una evidencia.';
  if (archivos.length > MAX_EVIDENCIAS) return `Puede subir máximo ${MAX_EVIDENCIAS} archivos.`;
  for (const a of archivos) {
    const ext = a.name.split('.').pop()?.toLowerCase() ?? '';
    if (!EXTENSIONES_EVIDENCIA.includes(ext)) return `El archivo "${a.name}" no es un formato permitido (imágenes, PDF o Word).`;
    if (a.size > MAX_EVIDENCIA_BYTES) return `El archivo "${a.name}" supera el tamaño máximo de 10 MB.`;
  }
  return null;
}

/** `1536` → `'1.5 KB'`. */
export function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
