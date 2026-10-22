import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Layout de login/registro: banner con el fondo del portal Comfasucre (fotografía con
 * degradado azul-violeta, partículas y ola) y tarjeta superpuesta.
 */
@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  template: `
    <div class="auth-body">
      <div class="login-banner">
        <div class="login-banner-overlay"></div>
        <div class="login-banner-particles"></div>
        <div class="login-banner-shape">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M 0,36 C 144,53.6 432,123.2 720,124 C 1008,124.8 1296,56.8 1440,40L1440 140L0 140z"></path>
          </svg>
        </div>
        <div class="login-banner-text">
          <div class="login-banner-title"><i class="ri-book-open-fill me-2"></i>Biblio Móvil</div>
          <div class="login-banner-tagline">Comfasucre de todos</div>
        </div>
      </div>
      <div class="auth-page-content pb-3">
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
