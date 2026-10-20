import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ApiRequestError, ApiService } from './api.service';

describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('prefija la URL base y omite query params vacíos', () => {
    api.get('solicitudes', { q: '', page: 2, estado: undefined }).subscribe();
    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/solicitudes`);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.has('q')).toBe(false);
    req.flush([]);
  });

  it('normaliza errores de validación (array de mensajes)', () => {
    let captured: ApiRequestError | undefined;
    api.post('auth/login', {}).subscribe({ error: (e: ApiRequestError) => (captured = e) });
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({ statusCode: 400, message: ['El correo no es válido', 'otro'] }, { status: 400, statusText: 'Bad Request' });
    expect(captured?.status).toBe(400);
    expect(captured?.message).toBe('El correo no es válido');
    expect(captured?.details).toEqual(['El correo no es válido', 'otro']);
  });

  it('informa cuando el servidor no responde', () => {
    let captured: ApiRequestError | undefined;
    api.get('health').subscribe({ error: (e: ApiRequestError) => (captured = e) });
    http.expectOne(`${environment.apiUrl}/health`).error(new ProgressEvent('error'), { status: 0 });
    expect(captured?.message).toContain('No se pudo conectar');
  });

  it('convierte rutas de archivos en URLs absolutas', () => {
    expect(api.fileUrl('uploads/portadas/a.jpg')).toBe(`${environment.apiUrl.replace(/\/api$/, '')}/uploads/portadas/a.jpg`);
    expect(api.fileUrl('https://cdn/x.png')).toBe('https://cdn/x.png');
    expect(api.fileUrl(null)).toBeNull();
  });
});
