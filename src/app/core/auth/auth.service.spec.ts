import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('arranca sin sesión', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.rol()).toBeNull();
  });

  it('login guarda token y usuario, y calcula el inicio por rol', () => {
    service.login('admin@c.co', 'x').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({
      token: 'jwt',
      expiresIn: '8h',
      usuario: { id: 1, nombre: 'Ana María', correo: 'admin@c.co', rol: 'profesional', institucionId: null },
    });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.token()).toBe('jwt');
    expect(service.primerNombre()).toBe('Ana');
    expect(service.hasRole('profesional')).toBe(true);
    expect(service.homeFor(service.rol())).toBe('/profesional/dashboard');
    expect(localStorage.getItem('bibliomovil.token')).toBe('jwt');
  });

  it('logout limpia el estado', () => {
    localStorage.setItem('bibliomovil.token', 'jwt');
    localStorage.setItem('bibliomovil.user', JSON.stringify({ id: 1, nombre: 'A', correo: 'a', rol: 'administrador', institucionId: null }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    const restored = TestBed.inject(AuthService);
    expect(restored.isAuthenticated()).toBe(true);
    restored.logout(false);
    expect(restored.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('bibliomovil.token')).toBeNull();
  });
});
