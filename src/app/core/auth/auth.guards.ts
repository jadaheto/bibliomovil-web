import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models/auth.models';
import { AuthService } from './auth.service';

/** Exige sesión iniciada; si no, redirige al login conservando la URL destino. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Exige uno de los roles indicados; si no, envía al inicio del rol actual. */
export function roleGuard(...roles: Rol[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
    if (auth.hasRole(...roles)) return true;
    return router.createUrlTree([auth.homeFor(auth.rol())]);
  };
}

/** Páginas públicas de acceso (login/registro): si ya hay sesión, va al inicio. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.createUrlTree([auth.homeFor(auth.rol())]) : true;
};
