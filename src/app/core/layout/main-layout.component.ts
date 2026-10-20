import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { AuthService } from '../auth/auth.service';
import { AlertsComponent } from '../ui/alerts.component';
import { AlertService } from '../ui/alert.service';
import { AsistentePanelComponent } from './asistente-panel.component';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';

const SIDEBAR_STORAGE_KEY = 'bm-sidebar-size';
const BREAKPOINT_MOVIL = 992;

export function esPantallaMovil(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < BREAKPOINT_MOVIL;
}

function leerSidebarColapsada(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'sm';
  } catch {
    return false;
  }
}

function guardarSidebarColapsada(colapsada: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, colapsada ? 'sm' : 'lg');
  } catch {
    /* almacenamiento no disponible: no se persiste */
  }
}

/** Layout autenticado: sidebar fija + topbar + contenido + footer (réplica del layout original). */
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, AlertsComponent, ConfirmDialogComponent, AsistentePanelComponent],
  template: `
    <div id="layout-wrapper" [class.sidebar-collapsed]="sidebarColapsada()">
      <app-sidebar [abierto]="sidebarAbierto()" [colapsada]="sidebarColapsada()" (navegar)="sidebarAbierto.set(false)" />
      <div class="sidebar-overlay" [class.show]="sidebarAbierto()" (click)="sidebarAbierto.set(false)"></div>
      <app-topbar (toggleSidebar)="toggleSidebar()" (abrirAsistente)="asistenteAbierto.set(true)" />
      <div class="main-content">
        <div class="page-content">
          <div class="container-fluid">
            <app-alerts />
            <router-outlet />
          </div>
        </div>
        <footer class="footer py-3">
          <div class="d-flex justify-content-between align-items-center px-4 flex-wrap gap-2">
            <div>{{ anio }} &copy; Comfasucre</div>
            <div class="text-end text-muted">Sistema de Gestión Biblio Móvil</div>
          </div>
        </footer>
      </div>
      @if (auth.hasRole('administrador')) {
        <app-asistente-panel [abierto]="asistenteAbierto()" (cerrar)="asistenteAbierto.set(false)" />
      }
      <app-confirm-dialog />
    </div>
  `,
})
export class MainLayoutComponent {
  readonly auth = inject(AuthService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  /** Sidebar desplegada como panel sobre el contenido (pantallas < 992px). */
  readonly sidebarAbierto = signal(false);
  /** Sidebar reducida a iconos (escritorio); se recuerda entre sesiones como en el tema original. */
  readonly sidebarColapsada = signal(leerSidebarColapsada());
  readonly asistenteAbierto = signal(false);
  readonly anio = new Date().getFullYear();

  /** Botón hamburguesa: en móvil muestra/oculta el panel; en escritorio colapsa/expande a iconos. */
  toggleSidebar(): void {
    if (esPantallaMovil()) {
      this.sidebarAbierto.update((v) => !v);
      return;
    }
    this.sidebarColapsada.update((v) => !v);
    guardarSidebarColapsada(this.sidebarColapsada());
  }

  constructor() {
    this.auth.refreshCurrent().subscribe({ error: () => undefined });
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.alerts.onNavigation());
  }
}
