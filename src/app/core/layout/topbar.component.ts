import { Component, DestroyRef, ElementRef, HostListener, inject, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ROL_LABEL } from '../models/auth.models';
import { NOTIFICACION_ESTILO, NotificacionesService } from '../notificaciones/notificaciones.service';
import { aplicarTema, guardarTema, temaActual } from '../ui/tema';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink],
  template: `
    <header id="page-topbar">
      <div class="d-flex align-items-center flex-grow-1 gap-3">
        <button type="button" class="topbar-btn" (click)="toggleSidebar.emit()" aria-label="Menú">
          <i class="ri-menu-line fs-4"></i>
        </button>
        <span class="badge badge-rol px-3 py-2">Rol: {{ rolLabel() }}</span>
      </div>

      <div class="d-flex align-items-center gap-3">
        @if (auth.hasRole('administrador')) {
          <button type="button" class="btn btn-ask-ai" id="btnAskAI" title="Asistente IA" (click)="abrirAsistente.emit()">
            <i class="ri-sparkling-2-line text-primary me-1"></i><span>Ask AI</span>
          </button>
        }
        <button type="button" class="topbar-btn" (click)="pantallaCompleta()" title="Pantalla Completa">
          <i class="ri-fullscreen-line fs-5"></i>
        </button>
        <button type="button" class="topbar-btn" (click)="cambiarTema()" title="Cambiar Tema">
          <i class="fs-5" [class]="temaOscuro() ? 'ri-moon-line' : 'ri-sun-line'"></i>
        </button>

        @if (auth.hasRole('administrador')) {
          <div class="position-relative" #notifRoot>
            <button type="button" class="topbar-btn position-relative" (click)="toggleNotificaciones()" title="Notificaciones">
              <i class="ri-notification-3-line fs-5"></i>
              @if (notificaciones.count() > 0) {
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger p-1" style="font-size: 0.55rem">
                  {{ notificaciones.count() }}
                </span>
              }
            </button>
            @if (notifAbierto()) {
              <div class="dropdown-menu dropdown-menu-end show p-0 notif-dropdown" style="position: absolute; right: 0; top: 2.2rem">
                <div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                  <h6 class="mb-0 fw-bold fs-14">Notificaciones</h6>
                  @if (notificaciones.count() > 0) {
                    <button type="button" class="btn btn-link btn-sm text-decoration-none fs-12" (click)="marcarTodas()">
                      <i class="ri-check-double-line me-1"></i>Marcar todas como leídas
                    </button>
                  }
                </div>
                <div class="notif-list">
                  @for (n of notificaciones.recientes(); track n.id) {
                    <a class="d-flex align-items-start py-2 px-3 text-decoration-none text-dark border-bottom notif-item" (click)="abrir(n.id, n.url)">
                      <div class="rounded p-2 me-2" [class]="estilo(n.tipo).color"><i class="fs-5" [class]="estilo(n.tipo).icono"></i></div>
                      <div class="flex-grow-1">
                        <div class="fw-semibold fs-12">{{ n.titulo }}</div>
                        <div class="text-muted fs-11">{{ n.mensaje }}</div>
                        <div class="text-muted fs-11 mt-1"><i class="ri-time-line me-1"></i>{{ notificaciones.tiempoRelativo(n.createdAt) }}</div>
                      </div>
                    </a>
                  } @empty {
                    <div class="text-center text-muted py-4 fs-12">No hay notificaciones recientes.</div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <div class="position-relative" #userRoot>
          <button type="button" class="topbar-btn d-flex align-items-center" (click)="toggleUsuario()">
            <div class="user-avatar me-2"><i class="ri-user-line"></i></div>
            <span class="user-name d-none d-md-inline text-dark fw-semibold fs-14">{{ auth.user()?.nombre ?? 'Usuario' }}</span>
            <i class="ri-arrow-down-s-line ms-1"></i>
          </button>
          @if (userAbierto()) {
            <div class="dropdown-menu dropdown-menu-end show" style="position: absolute; right: 0; top: 2.6rem">
              <h6 class="dropdown-header text-muted fw-semibold">¡Bienvenido!</h6>
              <a class="dropdown-item" routerLink="/perfil" (click)="userAbierto.set(false)"><i class="ri-user-line text-muted me-2"></i>Mi Perfil</a>
              <div class="dropdown-divider"></div>
              <a class="dropdown-item cursor-pointer" (click)="auth.logout()"><i class="ri-logout-box-r-line text-muted me-2"></i>Cerrar Sesión</a>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      .btn-ask-ai { height: 36px; padding: 0 0.9rem !important; border-radius: 999px !important; border: 1px solid transparent; background: transparent; color: inherit; font-size: 0.9rem !important; font-weight: 500 !important; display: inline-flex; align-items: center; }
      .btn-ask-ai:hover { background-color: rgba(92, 89, 232, 0.08); color: var(--vz-primary); }
      .btn-ask-ai i { font-size: 1.1rem; }
      @media (max-width: 575.98px) { .btn-ask-ai span { display: none; } }
    `,
  ],
})
export class TopbarComponent {
  readonly auth = inject(AuthService);
  readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly toggleSidebar = output<void>();
  readonly abrirAsistente = output<void>();
  readonly notifAbierto = signal(false);
  readonly userAbierto = signal(false);
  readonly temaOscuro = signal(temaActual() === 'dark');

  constructor() {
    if (this.auth.hasRole('administrador')) {
      this.notificaciones.cargarContador().subscribe({ error: () => undefined });
      const timer = setInterval(() => this.notificaciones.cargarContador().subscribe({ error: () => undefined }), 60_000);
      this.destroyRef.onDestroy(() => clearInterval(timer));
    }
  }

  rolLabel(): string {
    const rol = this.auth.rol();
    return rol ? ROL_LABEL[rol] : 'Afiliado';
  }

  estilo(tipo: string) {
    return NOTIFICACION_ESTILO[tipo] ?? { icono: 'ri-notification-3-line', color: 'bg-secondary-subtle text-secondary' };
  }

  toggleNotificaciones(): void {
    this.userAbierto.set(false);
    this.notifAbierto.update((v) => !v);
    if (this.notifAbierto()) {
      this.notificaciones.cargarRecientes().subscribe({ error: () => undefined });
      this.notificaciones.cargarContador().subscribe({ error: () => undefined });
    }
  }

  toggleUsuario(): void {
    this.notifAbierto.set(false);
    this.userAbierto.update((v) => !v);
  }

  abrir(id: number, url: string | null): void {
    this.notifAbierto.set(false);
    this.notificaciones.marcarLeida(id).subscribe({
      next: () => url && void this.router.navigateByUrl(url),
      error: () => url && void this.router.navigateByUrl(url),
    });
  }

  marcarTodas(): void {
    this.notificaciones.marcarTodasLeidas().subscribe({ error: () => undefined });
  }

  pantallaCompleta(): void {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  }

  cambiarTema(): void {
    const tema = this.temaOscuro() ? 'light' : 'dark';
    this.temaOscuro.set(tema === 'dark');
    aplicarTema(tema);
    guardarTema(tema);
  }

  @HostListener('document:click', ['$event'])
  cerrarAlClickFuera(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.notifAbierto.set(false);
      this.userAbierto.set(false);
    }
  }
}
