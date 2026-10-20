import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Paginated } from '../../shared/components/pagination.component';

/** Catálogos del backend (`modules/libros/domain/libro.ts`). */
export const CATEGORIAS_LIBRO = ['Literatura', 'Ciencia', 'Historia', 'Tecnologia', 'Arte', 'Educacion', 'Otro'] as const;
export type CategoriaLibro = (typeof CATEGORIAS_LIBRO)[number];

export const IDIOMAS_LIBRO: { value: string; label: string }[] = [
  { value: 'Espanol', label: 'Español' },
  { value: 'Ingles', label: 'Inglés' },
  { value: 'Frances', label: 'Francés' },
  { value: 'Portugues', label: 'Portugues' },
  { value: 'Otros', label: 'Otros' },
];

export const ESTADOS_CONSERVACION: { value: string; label: string }[] = [
  { value: 'Excelente', label: 'Excelente' },
  { value: 'Bueno', label: 'Bueno' },
  { value: 'Regular', label: 'Regular' },
  { value: 'Daniado', label: 'Dañado' },
];

/** Etiqueta legible para valores del catálogo (`Espanol` → `Español`, `Daniado` → `Dañado`). */
export function etiquetaCatalogo(valor: string | null | undefined): string {
  if (!valor) return '';
  return [...IDIOMAS_LIBRO, ...ESTADOS_CONSERVACION].find((o) => o.value === valor)?.label ?? valor;
}

export interface LibroImagen {
  id: number;
  libroId: number;
  url: string;
  orden: number;
  createdAt: string;
}

export interface Libro {
  id: number;
  isbn: string;
  titulo: string;
  autor: string;
  editorial: string | null;
  anioPublicacion: number | null;
  categoria: string;
  idioma: string;
  descripcion: string | null;
  cantidad: number;
  numeroPaginas: number | null;
  estadoConservacion: string;
  disponible: boolean;
  ubicacionEstante: string | null;
  codigoBarras: string | null;
  urlPortada: string | null;
  observaciones: string | null;
  activo: boolean;
  disponibleParaPrestamo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LibroDetalle extends Libro {
  imagenes: LibroImagen[];
}

/** Valores del formulario (nombres iguales a `LibroInputDto`). */
export interface LibroFormValues {
  titulo: string;
  isbn: string;
  autor: string;
  editorial: string;
  anioPublicacion: number | null;
  categoria: string;
  idioma: string;
  numeroPaginas: number | null;
  estadoConservacion: string;
  disponible: boolean;
  ubicacionEstante: string;
  codigoBarras: string;
  cantidad: number;
  observaciones: string;
  activo: boolean;
}

export type { Paginated };

/**
 * Construye el `multipart/form-data` que espera `POST/PUT /libros`:
 * los booleanos viajan como `'1'`/`'0'` y los vacíos se omiten.
 */
export function construirFormDataLibro(valores: LibroFormValues, portada?: File | null): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(valores)) {
    if (value === null || value === undefined || value === '') continue;
    if (typeof value === 'boolean') fd.append(key, value ? '1' : '0');
    else fd.append(key, String(value));
  }
  if (portada) fd.append('portada', portada, portada.name);
  return fd;
}

@Injectable({ providedIn: 'root' })
export class LibrosService {
  private readonly api = inject(ApiService);

  listar(q: string, page: number, limit = 20): Observable<Paginated<Libro>> {
    return this.api.get<Paginated<Libro>>('libros', { q, page, limit });
  }

  disponibles(): Observable<Libro[]> {
    return this.api.get<Libro[]>('libros/disponibles');
  }

  obtener(id: number | string): Observable<LibroDetalle> {
    return this.api.get<LibroDetalle>(`libros/${id}`);
  }

  crear(datos: FormData): Observable<LibroDetalle> {
    return this.api.post<LibroDetalle>('libros', datos);
  }

  actualizar(id: number | string, datos: FormData): Observable<LibroDetalle> {
    return this.api.put<LibroDetalle>(`libros/${id}`, datos);
  }

  eliminar(id: number | string): Observable<void> {
    return this.api.delete<void>(`libros/${id}`);
  }

  subirImagenes(id: number | string, datos: FormData): Observable<LibroImagen[]> {
    return this.api.post<LibroImagen[]>(`libros/${id}/imagenes`, datos);
  }

  eliminarImagen(id: number | string, imagenId: number): Observable<void> {
    return this.api.delete<void>(`libros/${id}/imagenes/${imagenId}`);
  }

  marcarPrincipal(id: number | string, imagenId: number): Observable<LibroDetalle> {
    return this.api.patch<LibroDetalle>(`libros/${id}/imagenes/${imagenId}/principal`, {});
  }
}
