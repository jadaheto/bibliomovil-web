/**
 * Tema claro/oscuro: se aplica con el atributo `data-bs-theme` de Bootstrap 5.3 en <html>
 * (los estilos propios lo usan en styles.scss) y se recuerda en localStorage.
 */
export type Tema = 'light' | 'dark';

const STORAGE_KEY = 'bm-theme';

export function leerTemaGuardado(): Tema {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function aplicarTema(tema: Tema): void {
  document.documentElement.setAttribute('data-bs-theme', tema);
}

export function guardarTema(tema: Tema): void {
  try {
    localStorage.setItem(STORAGE_KEY, tema);
  } catch {
    /* almacenamiento no disponible: no se persiste */
  }
}

export function temaActual(): Tema {
  return document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
}
