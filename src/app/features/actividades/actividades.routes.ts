import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/auth.guards';
import { AuthService } from '../../core/auth/auth.service';

/** El profesional no tiene calendario: `/actividades` lo envía a `/actividades/nueva` (como el sistema original). */
export const profesionalANueva: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.hasRole('profesional') ? inject(Router).createUrlTree(['/actividades/nueva']) : true;
};

export const ACTIVIDADES_ROUTES: Routes = [
  { path: '', canActivate: [profesionalANueva], loadComponent: () => import('./calendario.component').then((m) => m.CalendarioComponent) },
  {
    path: 'registradas',
    canActivate: [roleGuard('administrador')],
    loadComponent: () => import('./actividades-registradas.component').then((m) => m.ActividadesRegistradasComponent),
  },
  {
    path: 'nueva',
    canActivate: [roleGuard('administrador', 'profesional')],
    loadComponent: () => import('./actividad-form.component').then((m) => m.ActividadFormComponent),
  },
  {
    path: 'calendario-mensual',
    canActivate: [roleGuard('administrador')],
    loadComponent: () => import('./calendario-mensual.component').then((m) => m.CalendarioMensualComponent),
  },
  {
    path: 'estadisticas',
    canActivate: [roleGuard('administrador')],
    loadComponent: () => import('./actividades-estadisticas.component').then((m) => m.ActividadesEstadisticasComponent),
  },
  { path: ':id', loadComponent: () => import('./actividad-detail.component').then((m) => m.ActividadDetailComponent) },
];
