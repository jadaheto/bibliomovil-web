import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/auth.guards';

export const LIBROS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./libros-list.component').then((m) => m.LibrosListComponent) },
  {
    path: 'nuevo',
    canActivate: [roleGuard('administrador')],
    loadComponent: () => import('./libro-form.component').then((m) => m.LibroFormComponent),
  },
  { path: ':id', loadComponent: () => import('./libro-detail.component').then((m) => m.LibroDetailComponent) },
  {
    path: ':id/editar',
    canActivate: [roleGuard('administrador')],
    loadComponent: () => import('./libro-form.component').then((m) => m.LibroFormComponent),
  },
];
