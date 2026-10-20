import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { SolicitudesService } from './solicitudes.service';

describe('SolicitudesService', () => {
  let service: SolicitudesService;
  let http: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SolicitudesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista con filtros y paginación', () => {
    service.listar({ q: 'san', estado: 'Pendiente', page: 2 }).subscribe();
    const req = http.expectOne((r) => r.url === `${base}/solicitudes`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('q')).toBe('san');
    expect(req.request.params.get('estado')).toBe('Pendiente');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('20');
    req.flush({ items: [], meta: { total: 0, page: 2, limit: 20, totalPages: 0 } });
  });

  it('omite el estado vacío', () => {
    service.listar({ estado: '' }).subscribe();
    const req = http.expectOne((r) => r.url === `${base}/solicitudes`);
    expect(req.request.params.has('estado')).toBe(false);
    req.flush({ items: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
  });

  it('aprueba y rechaza con la acción y el motivo', () => {
    service.aprobar(7).subscribe();
    const a = http.expectOne(`${base}/solicitudes/7/estado`);
    expect(a.request.method).toBe('PATCH');
    expect(a.request.body).toEqual({ accion: 'aprobar' });
    a.flush({});

    service.rechazar(7, 'Sin cupo').subscribe();
    const r = http.expectOne(`${base}/solicitudes/7/estado`);
    expect(r.request.body).toEqual({ accion: 'rechazar', motivoRechazo: 'Sin cupo' });
    r.flush({});
  });

  it('crea una solicitud con POST', () => {
    service
      .crear({
        poliProteccionDatos: true,
        nombreInstitucion: 'IE',
        nombreRepresentante: 'Ana',
        correo: 'a@b.co',
        telefono: '300',
        objetivoEvento: 'Leer',
        ubicacionEvento: 'Patio',
        municipio: 'Sincelejo',
      })
      .subscribe();
    const req = http.expectOne(`${base}/solicitudes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.municipio).toBe('Sincelejo');
    req.flush({});
  });

  it('pide el reporte por rango y las estadísticas', () => {
    service.reporte('2026-01-01', '2026-01-31').subscribe();
    const rep = http.expectOne((r) => r.url === `${base}/solicitudes/reporte`);
    expect(rep.request.params.get('fechaInicio')).toBe('2026-01-01');
    expect(rep.request.params.get('fechaFin')).toBe('2026-01-31');
    rep.flush({});

    service.estadisticas().subscribe();
    http.expectOne(`${base}/solicitudes/estadisticas`).flush({ porMes: [], porEstado: [] });
  });
});
