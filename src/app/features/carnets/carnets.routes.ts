import { Routes } from '@angular/router';

export const CARNETS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'historial' },
  { path: 'registro', loadComponent: () => import('./carnet-registro.component').then((m) => m.CarnetRegistroComponent) },
  { path: 'historial', loadComponent: () => import('./carnets-historial.component').then((m) => m.CarnetsHistorialComponent) },
  { path: ':id', loadComponent: () => import('./carnet-detail.component').then((m) => m.CarnetDetailComponent) },
];
