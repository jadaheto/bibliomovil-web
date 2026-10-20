import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { CALIFICACIONES, Calificaciones, colorPromedio, promedio1 } from './calificaciones';
import { EvaluacionesService } from './evaluaciones.service';

const cincos = Object.fromEntries(CALIFICACIONES.map((c) => [c, 5])) as Calificaciones;

describe('EvaluacionesService', () => {
  let service: EvaluacionesService;
  let http: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(EvaluacionesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista y obtiene el detalle por actividad', () => {
    service.listar().subscribe();
    http.expectOne(`${base}/evaluaciones`).flush([]);
    service.detalle(4).subscribe();
    http.expectOne(`${base}/evaluaciones/actividad/4`).flush({});
  });

  it('pide el resumen del período con los parámetros', () => {
    service.resumenPeriodo({ tipo: 'trimestral', mesInicio: 5, mesFin: 7, anio: 2026 }).subscribe();
    const req = http.expectOne((r) => r.url === `${base}/evaluaciones/resumen-periodo`);
    expect(req.request.params.get('tipo')).toBe('trimestral');
    expect(req.request.params.get('mesInicio')).toBe('5');
    expect(req.request.params.get('mesFin')).toBe('7');
    expect(req.request.params.get('anio')).toBe('2026');
    req.flush({});
  });

  it('envía la evaluación pública sin autenticación al endpoint /evaluar', () => {
    service.evaluarPublico(4, { ...cincos, actividadMasSignificativa: 'a', tematicasSugeridas: 'b', comentariosSugerenciasGenerales: 'c' }).subscribe();
    const req = http.expectOne(`${base}/evaluar/actividad/4`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.califPuntualidad).toBe(5);
    expect(req.request.body.actividadMasSignificativa).toBe('a');
    req.flush({ mensaje: 'ok' });

    service.actividadPublica(4).subscribe();
    http.expectOne(`${base}/evaluar/actividad/4`).flush({});
  });

  it('registra una evaluación interna', () => {
    service.crear({ ...cincos, actividadId: 9 }).subscribe();
    const req = http.expectOne(`${base}/evaluaciones`);
    expect(req.request.body.actividadId).toBe(9);
    req.flush({});
  });

  it('formatea promedios y colores', () => {
    expect(promedio1(4.26)).toBe('4.3');
    expect(promedio1(null)).toBe('0.0');
    expect(colorPromedio(4)).toBe('#16a34a');
    expect(colorPromedio(3.2)).toBe('#f7b84b');
    expect(colorPromedio(2.9)).toBe('#e74c3c');
  });
});
