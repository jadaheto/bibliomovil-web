import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/auth.guards';

export const EVALUACIONES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard('administrador', 'institucion')],
    loadComponent: () => import('./evaluaciones-list.component').then((m) => m.EvaluacionesListComponent),
  },
  {
    path: 'nueva',
    canActivate: [roleGuard('administrador', 'institucion')],
    loadComponent: () => import('./evaluacion-form.component').then((m) => m.EvaluacionFormComponent),
  },
  {
    path: 'resumen',
    canActivate: [roleGuard('administrador')],
    loadComponent: () => import('./evaluaciones-resumen.component').then((m) => m.EvaluacionesResumenComponent),
  },
  {
    path: 'actividad/:id',
    canActivate: [roleGuard('administrador', 'institucion')],
    loadComponent: () => import('./evaluacion-detail.component').then((m) => m.EvaluacionDetailComponent),
  },
];
