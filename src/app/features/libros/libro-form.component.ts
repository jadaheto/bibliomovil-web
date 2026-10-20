import { Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { ConfirmService } from '../../shared/components/confirm.service';
import { FieldErrorComponent } from '../../shared/components/field-error.component';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { marcarTodoTocado } from '../../shared/forms/form.utils';
import {
  CATEGORIAS_LIBRO,
  ESTADOS_CONSERVACION,
  IDIOMAS_LIBRO,
  LibroDetalle,
  LibroImagen,
  LibrosService,
  construirFormDataLibro,
} from './libros.service';

export const IMAGENES_ACEPTADAS = 'image/jpeg,image/jpg,image/png,image/webp';

/** Alta y edición de libros (misma vista): datos + portada + galería de imágenes adicionales. */
@Component({
  selector: 'app-libro-form',
  imports: [ReactiveFormsModule, RouterLink, PageTitleComponent, FieldErrorComponent, LoadingComponent],
  templateUrl: './libro-form.component.html',
  styles: `
    .portada-preview { width: 100%; max-height: 320px; object-fit: contain; background: #f4f6f9; border-radius: 12px; }
    .portada-vacia { height: 220px; border: 2px dashed #cfd6e4; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #8a94a6; }
    .galeria-item { position: relative; border-radius: 10px; overflow: hidden; background: #f4f6f9; }
    .galeria-item img { width: 100%; height: 140px; object-fit: cover; display: block; }
    .galeria-acciones { position: absolute; inset: auto 0 0 0; display: flex; gap: 4px; justify-content: center; padding: 6px; background: rgba(14, 30, 56, 0.65); }
  `,
})
export class LibroFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(LibrosService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);
  private readonly confirm = inject(ConfirmService);

  readonly id = input<string>();
  readonly esEdicion = computed(() => !!this.id());
  readonly categorias = CATEGORIAS_LIBRO;
  readonly idiomas = IDIOMAS_LIBRO;
  readonly estadosConservacion = ESTADOS_CONSERVACION;
  readonly aceptados = IMAGENES_ACEPTADAS;

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly subiendo = signal(false);
  readonly error = signal<string | null>(null);
  /** Portada guardada en el servidor (edición). */
  readonly portadaActual = signal<string | null>(null);
  /** Nueva portada elegida (aún no enviada) y su vista previa. */
  readonly portadaArchivo = signal<File | null>(null);
  readonly portadaPreview = signal<string | null>(null);
  readonly imagenes = signal<LibroImagen[]>([]);
  readonly portadaMostrada = computed(() => this.portadaPreview() ?? this.portadaActual());
  readonly totalImagenes = computed(() => (this.portadaMostrada() ? 1 : 0) + this.imagenes().length);

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(500)]],
    isbn: ['', [Validators.required, Validators.maxLength(20)]],
    autor: ['', [Validators.required, Validators.maxLength(255)]],
    editorial: ['', Validators.maxLength(255)],
    anioPublicacion: [null as number | null, [Validators.min(1900), Validators.max(2099)]],
    categoria: ['', Validators.required],
    idioma: ['', Validators.required],
    numeroPaginas: [null as number | null, Validators.min(1)],
    estadoConservacion: ['', Validators.required],
    disponible: ['1'],
    ubicacionEstante: ['', Validators.maxLength(50)],
    codigoBarras: ['', Validators.maxLength(50)],
    cantidad: [1, [Validators.required, Validators.min(0)]],
    observaciones: [''],
    activo: ['1'],
  });

  ngOnInit(): void {
    if (this.esEdicion()) this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.service.obtener(this.id()!).subscribe({
      next: (libro) => {
        this.aplicar(libro);
        this.cargando.set(false);
      },
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message || 'Libro no encontrado.');
        void this.router.navigate(['/libros']);
      },
    });
  }

  private aplicar(libro: LibroDetalle): void {
    this.form.patchValue({
      titulo: libro.titulo,
      isbn: libro.isbn,
      autor: libro.autor,
      editorial: libro.editorial ?? '',
      anioPublicacion: libro.anioPublicacion,
      categoria: libro.categoria,
      idioma: libro.idioma,
      numeroPaginas: libro.numeroPaginas,
      estadoConservacion: libro.estadoConservacion,
      disponible: libro.disponible ? '1' : '0',
      ubicacionEstante: libro.ubicacionEstante ?? '',
      codigoBarras: libro.codigoBarras ?? '',
      cantidad: libro.cantidad,
      observaciones: libro.observaciones ?? '',
      activo: libro.activo ? '1' : '0',
    });
    this.portadaActual.set(libro.urlPortada);
    this.imagenes.set(libro.imagenes);
  }

  seleccionarPortada(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (!file) return;
    this.portadaArchivo.set(file);
    const reader = new FileReader();
    reader.onload = () => this.portadaPreview.set(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  }

  quitarPortadaNueva(input: HTMLInputElement): void {
    this.portadaArchivo.set(null);
    this.portadaPreview.set(null);
    input.value = '';
  }

  guardar(): void {
    if (this.form.invalid) {
      marcarTodoTocado(this.form);
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const datos = construirFormDataLibro(
      {
        titulo: v.titulo,
        isbn: v.isbn,
        autor: v.autor,
        editorial: v.editorial,
        anioPublicacion: v.anioPublicacion,
        categoria: v.categoria,
        idioma: v.idioma,
        numeroPaginas: v.numeroPaginas,
        estadoConservacion: v.estadoConservacion,
        disponible: v.disponible === '1',
        ubicacionEstante: v.ubicacionEstante,
        codigoBarras: v.codigoBarras,
        cantidad: v.cantidad,
        observaciones: v.observaciones,
        activo: v.activo === '1',
      },
      this.portadaArchivo(),
    );
    const request = this.esEdicion() ? this.service.actualizar(this.id()!, datos) : this.service.crear(datos);
    request.subscribe({
      next: () => {
        this.alerts.success(this.esEdicion() ? 'Libro actualizado exitosamente.' : 'Libro registrado exitosamente.');
        void this.router.navigate(['/libros']);
      },
      error: (err: ApiRequestError) => {
        this.error.set(err.details?.join(' ') ?? err.message);
        this.guardando.set(false);
      },
    });
  }

  subirImagenes(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivos = Array.from(input.files ?? []);
    if (!archivos.length) return;
    if (!this.esEdicion()) {
      this.alerts.warning('Primero guarda el libro para poder agregar imágenes adicionales.');
      input.value = '';
      return;
    }
    const fd = new FormData();
    archivos.forEach((f) => fd.append('imagenes', f, f.name));
    this.subiendo.set(true);
    this.service.subirImagenes(this.id()!, fd).subscribe({
      next: (nuevas) => {
        this.imagenes.update((list) => [...list, ...nuevas]);
        this.alerts.success(`Se subieron ${nuevas.length} imagen(es) correctamente.`);
        this.subiendo.set(false);
        input.value = '';
      },
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message || 'No se pudo subir ninguna imagen. Verifica el formato (JPG/PNG/WEBP) y el tamaño (máx. 5MB por imagen).');
        this.subiendo.set(false);
        input.value = '';
      },
    });
  }

  marcarPrincipal(imagen: LibroImagen): void {
    this.service.marcarPrincipal(this.id()!, imagen.id).subscribe({
      next: (libro) => {
        this.portadaActual.set(libro.urlPortada);
        this.imagenes.set(libro.imagenes);
        this.alerts.success('Imagen marcada como principal.');
      },
      error: (err: ApiRequestError) => this.alerts.error(err.message),
    });
  }

  async eliminarImagen(imagen: LibroImagen): Promise<void> {
    const ok = await this.confirm.ask({ titulo: 'Eliminar imagen', mensaje: '¿Eliminar esta imagen?', textoAceptar: 'Eliminar', peligro: true });
    if (!ok) return;
    this.service.eliminarImagen(this.id()!, imagen.id).subscribe({
      next: () => {
        this.imagenes.update((list) => list.filter((i) => i.id !== imagen.id));
        this.alerts.success('Imagen eliminada.');
      },
      error: (err: ApiRequestError) => this.alerts.error(err.message),
    });
  }
}
