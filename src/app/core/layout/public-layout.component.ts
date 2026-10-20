import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Layout de páginas públicas sin sesión (evaluación por QR, verificación de carnet). */
@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet],
  template: `
    <div class="auth-body py-4">
      <div class="container">
        <div class="text-center mb-4">
          <div class="fw-bold fs-3" style="font-family: 'Outfit', sans-serif; color: #0e1e38">
            <i class="ri-book-open-fill text-primary me-2"></i>Biblio Móvil
          </div>
          <div class="text-muted fs-12 text-uppercase" style="letter-spacing: 2px">Comfasucre de todos</div>
        </div>
        <router-outlet />
        <p class="text-center text-muted fs-12 mt-4">{{ anio }} &copy; Comfasucre · Sistema de Gestión Biblio Móvil</p>
      </div>
    </div>
  `,
})
export class PublicLayoutComponent {
  readonly anio = new Date().getFullYear();
}
