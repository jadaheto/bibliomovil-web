import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { FILTROS_CARNETS } from './carnets-historial.component';
import { CarnetsService, badgeCarnet, chipEstadoCarnet, etiquetaTipoIdentificacion, tipoPersonaLabel } from './carnets.service';

const base = environment.apiUrl;

describe('CarnetsService', () => {
  let service: CarnetsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CarnetsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('registra un carnet', () => {
    service.registrar({ tipoPersona: 'docente', nombres: 'Ana', apellidos: 'Pérez', tipoIdentificacion: 'CC', numeroIdentificacion: '1', correo: 'a@b.co', telefono: '3', area: 'Mat' }).subscribe();
    const req = http.expectOne(`${base}/carnets`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.tipoPersona).toBe('docente');
    req.flush({});
  });

  it('consulta el historial con filtros y paginación', () => {
    service.historial({ estado: 'Pendiente', q: 'ana' }, 2).subscribe();
    const req = http.expectOne((r) => r.url === `${base}/carnets`);
    expect(req.request.params.get('estado')).toBe('Pendiente');
    expect(req.request.params.get('q')).toBe('ana');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ items: [], meta: { total: 0, page: 2, limit: 20, totalPages: 1 } });
  });

  it('obtiene detalle, verificación pública y elimina', () => {
    service.obtener(4).subscribe();
    expect(http.expectOne(`${base}/carnets/4`).request.method).toBe('GET');
    service.verificar(4).subscribe();
    expect(http.expectOne(`${base}/carnets/verificar/4`).request.method).toBe('GET');
    service.eliminar(4).subscribe();
    expect(http.expectOne(`${base}/carnets/4`).request.method).toBe('DELETE');
  });

  it('administración: lista y cambia estado', () => {
    service.adminListar({ estado: '', q: '' }, 1).subscribe();
    const list = http.expectOne((r) => r.url === `${base}/admin/carnets`);
    expect(list.request.params.has('estado')).toBe(false);
    list.flush({ items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 1 } });

    service.adminCambiarEstado(9, 'Activo').subscribe();
    const patch = http.expectOne(`${base}/admin/carnets/9/estado`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ estado: 'Activo' });
    patch.flush({});
  });
});

describe('utilidades de carnets', () => {
  it('badges por estado (Rechazado y Cancelado comparten etiqueta)', () => {
    expect(badgeCarnet('Pendiente')).toEqual({ clase: 'bg-warning', texto: 'Pendiente' });
    expect(badgeCarnet('Activo').clase).toBe('bg-success');
    expect(badgeCarnet('Cancelado')).toEqual({ clase: 'bg-danger', texto: 'Rechazado' });
    expect(badgeCarnet('Suspendido').clase).toBe('bg-secondary');
    expect(badgeCarnet('Vencido').clase).toBe('bg-dark');
    expect(badgeCarnet(null).texto).toBe('Pendiente');
  });

  it('chip de la tarjeta y etiquetas', () => {
    expect(chipEstadoCarnet('Activo')).toBe('ok');
    expect(chipEstadoCarnet('Pendiente')).toBe('warn');
    expect(chipEstadoCarnet('Rechazado')).toBe('err');
    expect(chipEstadoCarnet(undefined)).toBe('warn');
    expect(tipoPersonaLabel('docente')).toBe('Docente');
    expect(tipoPersonaLabel('estudiante')).toBe('Estudiante');
    expect(etiquetaTipoIdentificacion('TI')).toBe('Tarjeta de Identidad');
  });

  it('los filtros del historial usan los estados reales', () => {
    expect(FILTROS_CARNETS.map((f) => f.value)).toEqual(['', 'Pendiente', 'Activo', 'Rechazado', 'Suspendido', 'Vencido']);
  });
});
