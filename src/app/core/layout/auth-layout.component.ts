import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Layout de login/registro: banner degradado + tarjeta superpuesta. */
@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  template: `
    <div class="auth-body">
      <div class="login-banner">
        <div class="login-banner-title"><i class="ri-book-open-fill me-2"></i>Biblio Móvil</div>
        <div class="login-banner-tagline">Comfasucre de todos</div>
      </div>
      <div class="auth-page-content pb-5">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-md-10 col-lg-7 col-xl-6">
              <router-outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {}
