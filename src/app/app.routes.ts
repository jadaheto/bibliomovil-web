import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/auth.guards';
import { AuthLayoutComponent } from './core/layout/auth-layout.component';
import { MainLayoutComponent } from './core/layout/main-layout.component';
import { PublicLayoutComponent } from './core/layout/public-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      { path: 'login', loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent) },
      {
        path: 'login/google',
        loadComponent: () => import('./features/auth/google-callback.component').then((m) => m.GoogleCallbackComponent),
      },
      {
        path: 'registro-institucion',
        loadComponent: () => import('./features/auth/registro-institucion.component').then((m) => m.RegistroInstitucionComponent),
      },
    ],
  },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: 'evaluar/actividad/:id',
        loadComponent: () => import('./features/evaluaciones/evaluar-publico.component').then((m) => m.EvaluarPublicoComponent),
      },
      {
        path: 'carnets/verificar/:id',
        loadComponent: () => import('./features/carnets/verificar-carnet.component').then((m) => m.VerificarCarnetComponent),
      },
    ],
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        canActivate: [roleGuard('administrador', 'institucion')],
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'profesional/dashboard',
        canActivate: [roleGuard('profesional')],
        loadComponent: () => import('./features/dashboard/dashboard-profesional.component').then((m) => m.DashboardProfesionalComponent),
      },
      { path: 'perfil', loadComponent: () => import('./features/perfil/perfil.component').then((m) => m.PerfilComponent) },
      {
        path: 'admin',
        canActivate: [roleGuard('administrador')],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'instituciones' },
          { path: 'instituciones', loadComponent: () => import('./features/admin/instituciones.component').then((m) => m.InstitucionesComponent) },
          { path: 'usuarios', loadComponent: () => import('./features/admin/profesionales.component').then((m) => m.ProfesionalesComponent) },
          { path: 'usuarios/nuevo', loadComponent: () => import('./features/admin/profesional-form.component').then((m) => m.ProfesionalFormComponent) },
          { path: 'usuarios/:id/editar', loadComponent: () => import('./features/admin/profesional-form.component').then((m) => m.ProfesionalFormComponent) },
          { path: 'carnets', loadComponent: () => import('./features/carnets/carnets-admin.component').then((m) => m.CarnetsAdminComponent) },
        ],
      },
      { path: 'solicitudes', loadChildren: () => import('./features/solicitudes/solicitudes.routes').then((m) => m.SOLICITUDES_ROUTES) },
      { path: 'actividades', loadChildren: () => import('./features/actividades/actividades.routes').then((m) => m.ACTIVIDADES_ROUTES) },
      { path: 'profesional', loadChildren: () => import('./features/actividades/profesional.routes').then((m) => m.PROFESIONAL_ROUTES) },
      { path: 'evaluaciones', loadChildren: () => import('./features/evaluaciones/evaluaciones.routes').then((m) => m.EVALUACIONES_ROUTES) },
      { path: 'libros', loadChildren: () => import('./features/libros/libros.routes').then((m) => m.LIBROS_ROUTES) },
      { path: 'prestamos', loadChildren: () => import('./features/prestamos/prestamos.routes').then((m) => m.PRESTAMOS_ROUTES) },
      { path: 'carnets', loadChildren: () => import('./features/carnets/carnets.routes').then((m) => m.CARNETS_ROUTES) },
    ],
  },
  { path: '**', loadComponent: () => import('./features/not-found.component').then((m) => m.NotFoundComponent) },
];
