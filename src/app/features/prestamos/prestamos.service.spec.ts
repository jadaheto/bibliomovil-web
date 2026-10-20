import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { hoyIso, noAnteriorAHoy } from './prestamo-solicitar.component';
import {
  PrestamosService,
  badgePrestamoAdmin,
  badgePrestamoInstitucion,
  opcionesEstadoPrestamo,
  puedeDevolverse,
} from './prestamos.service';

const base = environment.apiUrl;

describe('PrestamosService', () => {
  let service: PrestamosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PrestamosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtiene el panel de la institución', () => {
    service.misPrestamos().subscribe();
    const req = http.expectOne(`${base}/prestamos/mis-prestamos`);
    expect(req.request.method).toBe('GET');
    req.flush({ hoy: '2026-01-01', resumen: { activos: 0, porDevolver: 0, devueltos: 0, historialTotal: 0 }, activos: [], historial: [] });
  });

  it('solicita un préstamo con el cuerpo del DTO', () => {
    service
      .solicitar({ libroId: 4, personaTipo: 'Docente', personaNombre: 'Ana', personaId: '123', personaEmail: 'a@b.co', fechaLimiteDevolucion: '2026-12-01' })
      .subscribe();
    const req = http.expectOne(`${base}/prestamos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      libroId: 4,
      personaTipo: 'Docente',
      personaNombre: 'Ana',
      personaId: '123',
      personaEmail: 'a@b.co',
      fechaLimiteDevolucion: '2026-12-01',
    });
    req.flush({});
  });

  it('lista para el administrador con filtros (omite vacíos)', () => {
    service.admin({ estado: 'Activo', q: '' }, 3).subscribe();
    const req = http.expectOne((r) => r.url === `${base}/prestamos/admin`);
    expect(req.request.params.get('estado')).toBe('Activo');
    expect(req.request.params.has('q')).toBe(false);
    expect(req.request.params.get('page')).toBe('3');
    req.flush({ items: [], meta: { total: 0, page: 3, limit: 20, totalPages: 1 } });
  });

  it('cambia estado, devuelve y consulta detalle', () => {
    service.cambiarEstado(5, 'devolucion').subscribe();
    const estado = http.expectOne(`${base}/prestamos/5/estado`);
    expect(estado.request.method).toBe('PATCH');
    expect(estado.request.body).toEqual({ accion: 'devolucion' });
    estado.flush({});

    service.devolver(5).subscribe();
    expect(http.expectOne(`${base}/prestamos/5/devolver`).request.method).toBe('PATCH');

    service.obtener(5).subscribe();
    expect(http.expectOne(`${base}/prestamos/5`).request.method).toBe('GET');
  });
});

describe('opcionesEstadoPrestamo', () => {
  it('Activo: placeholder "Seleccione..." con entregados y devolución', () => {
    const r = opcionesEstadoPrestamo('Activo');
    expect(r.placeholder).toBe('Seleccione...');
    expect(r.opciones).toEqual([
      { value: 'libros_entregados', label: 'Libros entregados' },
      { value: 'devolucion', label: 'Devolución' },
    ]);
  });

  it('Libros entregados: marca la actual y permite devolución', () => {
    const r = opcionesEstadoPrestamo('Libros entregados');
    expect(r.placeholder).toBeNull();
    expect(r.opciones.map((o) => o.label)).toEqual(['Libros entregados (actual)', 'Devolución']);
  });

  it('Devuelto: "Cambiar a...", actual y reabrir', () => {
    const r = opcionesEstadoPrestamo('Devuelto');
    expect(r.placeholder).toBe('Cambiar a...');
    expect(r.opciones).toEqual([
      { value: 'devolucion', label: 'Devolución (actual)' },
      { value: 'libros_entregados', label: 'Reabrir como Libros entregados' },
    ]);
  });

  it('otros estados: ambas acciones sin placeholder', () => {
    const r = opcionesEstadoPrestamo('Perdido');
    expect(r.placeholder).toBeNull();
    expect(r.opciones.map((o) => o.value)).toEqual(['libros_entregados', 'devolucion']);
  });
});

describe('badges y reglas de préstamos', () => {
  it('badge del administrador', () => {
    expect(badgePrestamoAdmin({ estado: 'Activo' })).toEqual({ clase: 'bg-warning', texto: 'No entregado' });
    expect(badgePrestamoAdmin({ estado: 'Devuelto' }).clase).toBe('bg-success');
    expect(badgePrestamoAdmin({ estado: 'Libros entregados' }).clase).toBe('bg-info');
    expect(badgePrestamoAdmin({ estado: 'Perdido' }).clase).toBe('bg-danger');
    expect(badgePrestamoAdmin({ estado: 'Con retraso' })).toEqual({ clase: 'bg-secondary', texto: 'Con retraso' });
  });

  it('badge del historial de la institución', () => {
    expect(badgePrestamoInstitucion({ estado: 'Activo', vencido: true })).toEqual({ clase: 'bg-warning', texto: 'Vencido' });
    expect(badgePrestamoInstitucion({ estado: 'Activo', vencido: false })).toEqual({ clase: 'bg-primary', texto: 'Libros no entregados' });
    expect(badgePrestamoInstitucion({ estado: 'Devuelto', vencido: false }).clase).toBe('bg-success');
    expect(badgePrestamoInstitucion({ estado: 'Perdido', vencido: true }).clase).toBe('bg-danger');
  });

  it('solo se devuelven los préstamos pendientes', () => {
    expect(puedeDevolverse({ estado: 'Activo' })).toBe(true);
    expect(puedeDevolverse({ estado: 'Libros entregados' })).toBe(true);
    expect(puedeDevolverse({ estado: 'Devuelto' })).toBe(false);
    expect(puedeDevolverse({ estado: 'Perdido' })).toBe(false);
  });

  it('la fecha límite no puede ser anterior a hoy', () => {
    expect(noAnteriorAHoy(new FormControl('2000-01-01'))).toEqual({ min: { min: hoyIso() } });
    expect(noAnteriorAHoy(new FormControl(hoyIso()))).toBeNull();
    expect(noAnteriorAHoy(new FormControl('2999-01-01'))).toBeNull();
    expect(noAnteriorAHoy(new FormControl(''))).toBeNull();
  });
});
