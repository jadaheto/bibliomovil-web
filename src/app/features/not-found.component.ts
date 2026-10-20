import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="auth-body d-flex align-items-center justify-content-center min-vh-100 p-3">
      <div class="card text-center" style="max-width: 480px; width: 100%">
        <div class="card-body p-5">
          <i class="ri-compass-3-line text-primary" style="font-size: 4rem"></i>
          <h1 class="text-primary mt-3">¡Ups!</h1>
          <h4 class="text-uppercase">Página no encontrada</h4>
          <p class="text-muted">La página que buscas no existe o fue movida.</p>
          <a [routerLink]="auth.homeFor(auth.rol())" class="btn btn-primary"><i class="ri-home-5-line me-1"></i>Volver al inicio</a>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundComponent {
  readonly auth = inject(AuthService);
}
