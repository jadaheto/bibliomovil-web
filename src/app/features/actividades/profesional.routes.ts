import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/auth.guards';

/** Rutas `/profesional/*` (el dashboard está en `app.routes.ts`). */
export const PROFESIONAL_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'actividades' },
  {
    path: 'actividades',
    canActivate: [roleGuard('profesional')],
    loadComponent: () => import('./mis-actividades.component').then((m) => m.MisActividadesComponent),
  },
  {
    path: 'actividades/:id/ejecucion',
    canActivate: [roleGuard('profesional')],
    loadComponent: () => import('./registrar-ejecucion.component').then((m) => m.RegistrarEjecucionComponent),
  },
];
