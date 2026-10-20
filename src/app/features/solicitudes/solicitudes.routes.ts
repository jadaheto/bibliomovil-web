import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/auth.guards';

export const SOLICITUDES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./solicitudes-list.component').then((m) => m.SolicitudesListComponent) },
  { path: 'nueva', loadComponent: () => import('./solicitud-form.component').then((m) => m.SolicitudFormComponent) },
  {
    path: 'reporte',
    canActivate: [roleGuard('administrador')],
    loadComponent: () => import('./solicitudes-reporte.component').then((m) => m.SolicitudesReporteComponent),
  },
  {
    path: 'estadisticas',
    canActivate: [roleGuard('administrador')],
    loadComponent: () => import('./solicitudes-estadisticas.component').then((m) => m.SolicitudesEstadisticasComponent),
  },
  { path: ':id', loadComponent: () => import('./solicitud-detail.component').then((m) => m.SolicitudDetailComponent) },
];
