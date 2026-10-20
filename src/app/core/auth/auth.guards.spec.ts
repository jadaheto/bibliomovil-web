import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './auth.guards';

function sesion(rol: 'administrador' | 'profesional' | 'institucion' | null): void {
  localStorage.clear();
  if (rol) {
    localStorage.setItem('bibliomovil.token', 'jwt');
    localStorage.setItem('bibliomovil.user', JSON.stringify({ id: 1, nombre: 'A', correo: 'a', rol, institucionId: null }));
  }
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
}

const route = {} as ActivatedRouteSnapshot;
const state = { url: '/solicitudes' } as RouterStateSnapshot;

describe('Guards de autenticación', () => {
  it('authGuard redirige al login sin sesión y conserva returnUrl', () => {
    sesion(null);
    const result = TestBed.runInInjectionContext(() => authGuard(route, state)) as UrlTree;
    expect(result.toString()).toBe('/login?returnUrl=%2Fsolicitudes');
  });

  it('authGuard permite con sesión', () => {
    sesion('institucion');
    expect(TestBed.runInInjectionContext(() => authGuard(route, state))).toBe(true);
  });

  it('roleGuard permite el rol correcto y redirige al inicio del rol incorrecto', () => {
    sesion('profesional');
    expect(TestBed.runInInjectionContext(() => roleGuard('profesional')(route, state))).toBe(true);
    const tree = TestBed.runInInjectionContext(() => roleGuard('administrador')(route, state)) as UrlTree;
    expect(tree.toString()).toBe('/profesional/dashboard');
  });

  it('guestGuard envía al inicio cuando ya hay sesión', () => {
    sesion('administrador');
    const tree = TestBed.runInInjectionContext(() => guestGuard(route, state)) as UrlTree;
    expect(tree.toString()).toBe('/dashboard');
    sesion(null);
    expect(TestBed.runInInjectionContext(() => guestGuard(route, state))).toBe(true);
  });
});
