import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { diapositivasDe } from './libro-detail.component';
import { LibroFormValues, LibrosService, construirFormDataLibro, etiquetaCatalogo } from './libros.service';

const base = environment.apiUrl;

const valores: LibroFormValues = {
  titulo: 'Cien años de soledad',
  isbn: '978-1',
  autor: 'G. García Márquez',
  editorial: '',
  anioPublicacion: 1967,
  categoria: 'Literatura',
  idioma: 'Espanol',
  numeroPaginas: null,
  estadoConservacion: 'Bueno',
  disponible: true,
  ubicacionEstante: '',
  codigoBarras: '',
  cantidad: 3,
  observaciones: '',
  activo: false,
};

describe('LibrosService', () => {
  let service: LibrosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(LibrosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista el catálogo con búsqueda y paginación', () => {
    service.listar('garcia', 2).subscribe();
    const req = http.expectOne((r) => r.url === `${base}/libros`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('q')).toBe('garcia');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('20');
    req.flush({ items: [], meta: { total: 0, page: 2, limit: 20, totalPages: 1 } });
  });

  it('consulta disponibles y detalle', () => {
    service.disponibles().subscribe();
    http.expectOne(`${base}/libros/disponibles`).flush([]);
    service.obtener(7).subscribe();
    http.expectOne(`${base}/libros/7`).flush({});
  });

  it('crea y actualiza con multipart (FormData)', () => {
    const fd = construirFormDataLibro(valores);
    service.crear(fd).subscribe();
    const post = http.expectOne(`${base}/libros`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toBe(fd);
    post.flush({});

    service.actualizar(3, fd).subscribe();
    const put = http.expectOne(`${base}/libros/3`);
    expect(put.request.method).toBe('PUT');
    put.flush({});
  });

  it('elimina libro e imágenes y marca la principal', () => {
    service.eliminar(3).subscribe();
    expect(http.expectOne(`${base}/libros/3`).request.method).toBe('DELETE');
    service.eliminarImagen(3, 9).subscribe();
    expect(http.expectOne(`${base}/libros/3/imagenes/9`).request.method).toBe('DELETE');
    service.marcarPrincipal(3, 9).subscribe();
    expect(http.expectOne(`${base}/libros/3/imagenes/9/principal`).request.method).toBe('PATCH');
    service.subirImagenes(3, new FormData()).subscribe();
    expect(http.expectOne(`${base}/libros/3/imagenes`).request.method).toBe('POST');
  });
});

describe('construirFormDataLibro', () => {
  it('serializa booleanos como 1/0, omite vacíos y adjunta la portada', () => {
    const portada = new File(['x'], 'portada.png', { type: 'image/png' });
    const fd = construirFormDataLibro(valores, portada);
    expect(fd.get('disponible')).toBe('1');
    expect(fd.get('activo')).toBe('0');
    expect(fd.get('cantidad')).toBe('3');
    expect(fd.get('anioPublicacion')).toBe('1967');
    expect(fd.has('editorial')).toBe(false);
    expect(fd.has('numeroPaginas')).toBe(false);
    expect((fd.get('portada') as File).name).toBe('portada.png');
  });

  it('no adjunta portada cuando no se eligió archivo', () => {
    expect(construirFormDataLibro(valores, null).has('portada')).toBe(false);
  });
});

describe('utilidades de libros', () => {
  it('traduce los valores del catálogo', () => {
    expect(etiquetaCatalogo('Espanol')).toBe('Español');
    expect(etiquetaCatalogo('Daniado')).toBe('Dañado');
    expect(etiquetaCatalogo('Literatura')).toBe('Literatura');
    expect(etiquetaCatalogo(null)).toBe('');
  });

  it('arma el carrusel con la portada primero', () => {
    const slides = diapositivasDe({
      urlPortada: 'http://x/p.png',
      imagenes: [{ id: 1, libroId: 1, url: 'http://x/a.png', orden: 0, createdAt: '' }],
    });
    expect(slides.map((s) => s.url)).toEqual(['http://x/p.png', 'http://x/a.png']);
    expect(slides[0].principal).toBe(true);
    expect(slides[1].principal).toBe(false);
    expect(diapositivasDe({ urlPortada: null, imagenes: [] })).toEqual([]);
    expect(diapositivasDe(null)).toEqual([]);
  });
});
