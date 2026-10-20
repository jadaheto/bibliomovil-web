import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Rol } from '../models/auth.models';

interface MenuItem {
  label: string;
  icon: string;
  link?: string;
  exact?: boolean;
  children?: { label: string; link: string }[];
  roles: Rol[];
  /** Solo instituciones carnetizadas. */
  requiereCarnetizada?: boolean;
}

/** Menú lateral: mismos ítems, iconos y visibilidad por rol que el sistema original. */
const MENU: MenuItem[] = [
  { label: 'Inicio', icon: 'ri-home-5-line', link: '/dashboard', roles: ['administrador', 'institucion'] },
  { label: 'Inicio', icon: 'ri-home-5-line', link: '/profesional/dashboard', roles: ['profesional'] },
  { label: 'Solicitudes', icon: 'ri-file-list-3-line', link: '/solicitudes', roles: ['administrador', 'institucion'] },
  { label: 'Actividades', icon: 'ri-calendar-check-line', link: '/actividades', exact: true, roles: ['administrador', 'institucion'] },
  { label: 'Actividades', icon: 'ri-calendar-check-line', link: '/actividades/nueva', roles: ['profesional'] },
  { label: 'Mis Actividades', icon: 'ri-list-check-line', link: '/profesional/actividades', roles: ['profesional'] },
  { label: 'Evaluaciones', icon: 'ri-star-line', link: '/evaluaciones', roles: ['administrador', 'institucion'] },
  {
    label: 'Préstamos',
    icon: 'ri-book-open-line',
    roles: ['administrador'],
    children: [
      { label: 'Agregar Libro', link: '/libros/nuevo' },
      { label: 'Consultar Préstamos', link: '/prestamos/admin' },
      { label: 'Catálogo de Libros', link: '/libros' },
    ],
  },
  {
    label: 'Carnets Digitales',
    icon: 'ri-id-card-line',
    roles: ['administrador'],
    children: [
      { label: 'Registro', link: '/carnets/registro' },
      { label: 'Gestión de Carnets', link: '/admin/carnets' },
    ],
  },
  { label: 'Instituciones', icon: 'ri-building-line', link: '/admin/instituciones', roles: ['administrador'] },
  { label: 'Gestión de Usuarios', icon: 'ri-user-settings-line', link: '/admin/usuarios', roles: ['administrador'] },
  {
    label: 'Carnets Digitales',
    icon: 'ri-id-card-line',
    roles: ['institucion'],
    requiereCarnetizada: true,
    children: [
      { label: 'Registro', link: '/carnets/registro' },
      { label: 'Historial', link: '/carnets/historial' },
    ],
  },
  { label: 'Préstamos', icon: 'ri-book-open-line', link: '/prestamos', exact: true, roles: ['institucion'] },
];

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="app-menu" id="sidebarMenu" [class.show]="abierto()" [class.collapsed]="colapsada()">
      <div class="navbar-brand-box">
        <a class="logo-static" aria-label="Biblio Móvil">
          <img src="assets/images/bibliomovil.png" alt="Biblio Móvil" class="brand-logo-img" />
          <i class="ri-book-open-fill brand-logo-sm" aria-hidden="true"></i>
        </a>
      </div>
      <div id="scrollbar">
        <ul class="navbar-nav list-unstyled" id="navbar-nav">
          <li class="menu-title">Mi Portal</li>
          @for (item of items(); track item.label + (item.link ?? '')) {
            <li class="nav-item">
              @if (item.children) {
                <a
                  class="nav-link"
                  role="button"
                  [attr.aria-expanded]="expandido() === item.label"
                  [attr.title]="colapsada() ? item.label : null"
                  (click)="toggle(item.label)"
                >
                  <i [class]="item.icon"></i>
                  <span>{{ item.label }}</span>
                  <i class="ri-arrow-down-s-line menu-arrow"></i>
                </a>
                <div class="collapse menu-dropdown" [class.show]="expandido() === item.label">
                  <ul class="nav nav-sm flex-column list-unstyled">
                    @for (child of item.children; track child.link) {
                      <li class="nav-item">
                        <a class="nav-link" [routerLink]="child.link" routerLinkActive="active" (click)="navegar.emit()">
                          {{ child.label }}
                        </a>
                      </li>
                    }
                  </ul>
                </div>
              } @else {
                <a
                  class="nav-link"
                  [routerLink]="item.link"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                  [attr.title]="colapsada() ? item.label : null"
                  (click)="navegar.emit()"
                >
                  <i [class]="item.icon"></i>
                  <span>{{ item.label }}</span>
                </a>
              }
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  readonly abierto = input(false);
  /** Modo escritorio reducido a iconos; los submenús se muestran como panel flotante al pasar el ratón. */
  readonly colapsada = input(false);
  readonly navegar = output<void>();
  readonly expandido = signal<string | null>(null);

  readonly items = computed(() => {
    const rol = this.auth.rol();
    const carnetizada = this.auth.current()?.esCarnetizada ?? false;
    if (!rol) return [];
    return MENU.filter((m) => m.roles.includes(rol) && (!m.requiereCarnetizada || carnetizada));
  });

  constructor() {
    // Abre el submenú que contiene la ruta actual al cargar.
    const path = typeof location !== 'undefined' ? location.pathname : '';
    const abierto = MENU.find((m) => m.children?.some((c) => path.startsWith(c.link)));
    if (abierto) this.expandido.set(abierto.label);
  }

  toggle(label: string): void {
    this.expandido.update((actual) => (actual === label ? null : label));
  }
}
