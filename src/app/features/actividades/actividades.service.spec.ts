import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ActividadesService, badgeActividad, etiquetaEstadoActividad } from './actividades.service';

describe('ActividadesService', () => {
  let service: ActividadesService;
  let http: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ActividadesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista con filtros de mes/año/estado y omite los vacíos', () => {
    service.listar({ mes: 10, anio: 2026, estado: '' , page: 3 }).subscribe();
    const req = http.expectOne((r) => r.url === `${base}/actividades`);
    expect(req.request.params.get('mes')).toBe('10');
    expect(req.request.params.get('anio')).toBe('2026');
    expect(req.request.params.has('estado')).toBe(false);
    expect(req.request.params.get('page')).toBe('3');
    req.flush({ items: [], meta: { total: 0, page: 3, limit: 20, totalPages: 0 } });
  });

  it('pide los eventos del calendario del mes', () => {
    service.calendario(4, 2026).subscribe();
    const req = http.expectOne((r) => r.url === `${base}/actividades/calendario`);
    expect(req.request.params.get('mes')).toBe('4');
    expect(req.request.params.get('anio')).toBe('2026');
    req.flush([]);
  });

  it('registra la ejecución enviando FormData', () => {
    const fd = new FormData();
    fd.append('resultados', 'ok');
    service.registrarEjecucion(5, fd).subscribe();
    const req = http.expectOne(`${base}/actividades/5/ejecucion`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(fd);
    req.flush({});
  });

  it('reprograma y cancela con PATCH', () => {
    service.reprogramar(5, { fechaActividad: '2026-05-01', horaInicio: '08:00' }).subscribe();
    const r = http.expectOne(`${base}/actividades/5/reprogramar`);
    expect(r.request.method).toBe('PATCH');
    expect(r.request.body).toEqual({ fechaActividad: '2026-05-01', horaInicio: '08:00' });
    r.flush({});

    service.cancelar(5, 'Lluvia').subscribe();
    const c = http.expectOne(`${base}/actividades/5/cancelar`);
    expect(c.request.body).toEqual({ motivoCancelacion: 'Lluvia' });
    c.flush({});
  });

  it('lista mis actividades y los profesionales activos', () => {
    service.misActividades(2, 'Pendiente').subscribe();
    const m = http.expectOne((r) => r.url === `${base}/actividades/mis-actividades`);
    expect(m.request.params.get('estado')).toBe('Pendiente');
    m.flush({ items: [], meta: { total: 0, page: 2, limit: 20, totalPages: 0 } });

    service.profesionalesActivos().subscribe();
    http.expectOne(`${base}/profesionales/activos`).flush([]);
  });

  it('traduce etiquetas y badges de estado', () => {
    expect(etiquetaEstadoActividad('Pendiente')).toBe('Programada');
    expect(etiquetaEstadoActividad('Evaluada')).toBe('Evaluada');
    expect(badgeActividad('Evaluada')).toBe('badge bg-success');
    expect(badgeActividad('Cancelada')).toBe('badge bg-danger');
    expect(badgeActividad('Pendiente')).toBe('badge bg-warning');
  });
});
