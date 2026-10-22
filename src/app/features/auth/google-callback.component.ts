import { Component, OnInit, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

/** Recibe el JWT del ingreso con Google (en el fragmento `#token=`) y abre la sesión. */
@Component({
  selector: 'app-google-callback',
  template: `
    <div class="card login-card">
      <div class="card-body p-4 p-md-5 text-center">
        <span class="spinner-border text-secondary mb-3"></span>
        <p class="mb-0">Iniciando sesión con Google…</p>
      </div>
    </div>
  `,
})
export class GoogleCallbackComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    inject(Title).setTitle('Iniciar Sesión - Biblio Móvil Comfasucre');
  }

  ngOnInit(): void {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    // Se limpia el fragmento para que el token no quede en el historial.
    history.replaceState(null, '', window.location.pathname);
    if (!token) {
      void this.fallar('No se recibió la sesión de Google. Intente de nuevo.');
      return;
    }
    this.auth.loginConToken(token).subscribe({
      next: (me) => void this.router.navigateByUrl(this.auth.homeFor(me.rol)),
      error: () => {
        this.auth.logout(false);
        void this.fallar('No fue posible iniciar sesión con Google.');
      },
    });
  }

  private fallar(mensaje: string): Promise<boolean> {
    return this.router.navigate(['/login'], { queryParams: { error: mensaje } });
  }
}
