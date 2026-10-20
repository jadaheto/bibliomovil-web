import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/auth.guards';

export const PRESTAMOS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard('institucion')],
    loadComponent: () => import('./prestamos-institucion.component').then((m) => m.PrestamosInstitucionComponent),
  },
  {
    path: 'solicitar',
    canActivate: [roleGuard('institucion')],
    loadComponent: () => import('./prestamo-solicitar.component').then((m) => m.PrestamoSolicitarComponent),
  },
  {
    path: 'admin',
    canActivate: [roleGuard('administrador')],
    loadComponent: () => import('./prestamos-admin.component').then((m) => m.PrestamosAdminComponent),
  },
  {
    path: ':id',
    canActivate: [roleGuard('administrador', 'institucion')],
    loadComponent: () => import('./prestamo-detail.component').then((m) => m.PrestamoDetailComponent),
  },
];
