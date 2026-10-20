import { DatePipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { Prestamo, PrestamosService, badgePrestamoAdmin, badgePrestamoInstitucion } from './prestamos.service';

/** Detalle de un préstamo (administrador o institución dueña). */
@Component({
  selector: 'app-prestamo-detail',
  imports: [DatePipe, RouterLink, PageTitleComponent, LoadingComponent],
  template: `
    <app-page-title titulo="Detalle del Préstamo">
      <a [routerLink]="volver" class="btn btn-secondary btn-sm"><i class="ri-arrow-left-line me-1"></i>Volver</a>
    </app-page-title>

    @if (!prestamo()) {
      <app-loading />
    } @else if (prestamo(); as p) {
      <div class="row">
        <div class="col-lg-8">
          <div class="card">
            <div class="card-header bg-primary"><h5 class="card-title">Información del Préstamo</h5></div>
            <div class="card-body">
              <dl class="row mb-0">
                <dt class="col-sm-4">ID</dt><dd class="col-sm-8">{{ p.id }}</dd>
                <dt class="col-sm-4">Libro</dt>
                <dd class="col-sm-8"><a [routerLink]="['/libros', p.libroId]">{{ p.libroTitulo || 'N/A' }}</a>@if (p.libroAutor) { <small class="text-muted"> · {{ p.libroAutor }}</small> }</dd>
                <dt class="col-sm-4">Institución</dt><dd class="col-sm-8">{{ p.institucionNombre || 'N/A' }}</dd>
                <dt class="col-sm-4">Solicitante</dt><dd class="col-sm-8">{{ p.personaNombre }}</dd>
                <dt class="col-sm-4">Tipo de persona</dt><dd class="col-sm-8">{{ p.personaTipo === 'Institucion' ? 'Institución' : p.personaTipo }}</dd>
                <dt class="col-sm-4">Documento</dt><dd class="col-sm-8">{{ p.personaId || 'No registrado' }}</dd>
                <dt class="col-sm-4">Correo electrónico</dt><dd class="col-sm-8">{{ p.personaEmail || 'No registrado' }}</dd>
                <dt class="col-sm-4">Fecha Préstamo</dt><dd class="col-sm-8">{{ p.fechaPrestamo | date: 'dd/MM/yyyy' }}</dd>
                <dt class="col-sm-4">Fecha Límite</dt><dd class="col-sm-8">{{ p.fechaLimiteDevolucion | date: 'dd/MM/yyyy' }}</dd>
                <dt class="col-sm-4">Fecha Devolución</dt>
                <dd class="col-sm-8">@if (p.fechaDevolucion) { {{ p.fechaDevolucion | date: 'dd/MM/yyyy' }} } @else { <span class="text-muted">Pendiente</span> }</dd>
                <dt class="col-sm-4">Estado</dt>
                <dd class="col-sm-8">
                  <span class="badge" [class]="badge(p).clase">{{ badge(p).texto }}</span>
                  @if (p.vencido) { <span class="badge bg-danger ms-1">Vencido</span> }
                </dd>
                <dt class="col-sm-4">Responsable</dt><dd class="col-sm-8">{{ p.profesionalResponsable || 'No registrado' }}</dd>
                <dt class="col-sm-4">Observaciones</dt><dd class="col-sm-8">{{ p.observaciones || '—' }}</dd>
                <dt class="col-sm-4">Registrado</dt><dd class="col-sm-8">{{ p.createdAt | date: 'dd/MM/yyyy HH:mm' }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class PrestamoDetailComponent {
  private readonly auth = inject(AuthService);
  private readonly service = inject(PrestamosService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  readonly prestamo = signal<Prestamo | null>(null);
  readonly volver = this.auth.hasRole('administrador') ? '/prestamos/admin' : '/prestamos';

  readonly badge = (p: Prestamo) => (this.auth.hasRole('administrador') ? badgePrestamoAdmin(p) : badgePrestamoInstitucion(p));

  ngOnInit(): void {
    this.service.obtener(this.id()).subscribe({
      next: (p) => this.prestamo.set(p),
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message || 'Préstamo no encontrado.');
        void this.router.navigate([this.volver]);
      },
    });
  }
}
