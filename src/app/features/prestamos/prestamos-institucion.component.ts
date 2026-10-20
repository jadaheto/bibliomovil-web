import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { ConfirmService } from '../../shared/components/confirm.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { MisPrestamos, Prestamo, PrestamosService, badgePrestamoInstitucion, puedeDevolverse } from './prestamos.service';

interface Tarjeta {
  label: string;
  value: number;
  icono: string;
  color: string;
}

/** Panel de préstamos de la institución: resumen, activos e historial. */
@Component({
  selector: 'app-prestamos-institucion',
  imports: [DatePipe, RouterLink, PageTitleComponent, LoadingComponent],
  template: `
    <app-page-title titulo="Préstamos de Libros">
      <a routerLink="/libros" class="btn btn-outline-primary btn-sm"><i class="ri-book-2-line me-1"></i>Consultar Catálogo</a>
      <a routerLink="/prestamos/solicitar" class="btn btn-primary btn-sm"><i class="ri-add-line me-1"></i>Solicitar Préstamo</a>
    </app-page-title>

    @if (!datos()) {
      <app-loading />
    } @else if (datos(); as d) {
      <div class="row g-3 mb-4">
        @for (t of tarjetas(); track t.label) {
          <div class="col-sm-6 col-xl-3">
            <div class="quick-card">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="quick-card-label mb-1">{{ t.label }}</div>
                  <div class="quick-card-value">{{ t.value }}</div>
                </div>
                <div class="quick-card-icon-wrapper" [class]="t.color"><i [class]="t.icono"></i></div>
              </div>
            </div>
          </div>
        }
      </div>

      <div class="card">
        <div class="card-header bg-success"><h5 class="card-title">Préstamos Activos</h5></div>
        <div class="card-body">
          @if (d.activos.length === 0) {
            <div class="text-center text-muted py-4">
              <i class="ri-book-open-line fs-2 d-block mb-2"></i>
              <p>No tienes préstamos activos</p>
              <a routerLink="/libros" class="btn btn-primary btn-sm"><i class="ri-book-2-line me-1"></i>Ver Catálogo de Libros</a>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr><th>Libro</th><th>Autor</th><th>Fecha Préstamo</th><th>Fecha Devolución</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  @for (p of d.activos; track p.id) {
                    <tr>
                      <td class="fw-semibold">{{ p.libroTitulo || 'N/A' }}</td>
                      <td>{{ p.libroAutor || '—' }}</td>
                      <td>{{ p.fechaPrestamo | date: 'dd/MM/yyyy' }}</td>
                      <td>{{ p.fechaLimiteDevolucion | date: 'dd/MM/yyyy' }}</td>
                      <td><span class="badge" [class]="p.vencido ? 'bg-danger' : 'bg-success'">{{ p.vencido ? 'Vencido' : 'Activo' }}</span></td>
                      <td>
                        <div class="d-flex gap-1">
                          <a [routerLink]="['/prestamos', p.id]" class="btn btn-outline-primary btn-sm"><i class="ri-eye-line"></i> Ver</a>
                          <button type="button" class="btn btn-outline-success btn-sm" (click)="devolver(p)" [disabled]="procesando() === p.id">
                            <i class="ri-arrow-go-back-line"></i> Devolver
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h5 class="card-title">Historial de Préstamos</h5></div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr><th>Libro</th><th>Fecha Préstamo</th><th>Fecha Devolución</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                @for (p of d.historial; track p.id) {
                  <tr>
                    <td class="fw-semibold">{{ p.libroTitulo || 'N/A' }}</td>
                    <td>{{ p.fechaPrestamo | date: 'dd/MM/yyyy' }}</td>
                    <td>
                      @if (p.fechaDevolucion) { {{ p.fechaDevolucion | date: 'dd/MM/yyyy' }} } @else { <span class="text-muted">Pendiente</span> }
                    </td>
                    <td><span class="badge" [class]="badge(p).clase">{{ badge(p).texto }}</span></td>
                    <td>
                      <div class="d-flex gap-1">
                        <a [routerLink]="['/prestamos', p.id]" class="btn btn-outline-primary btn-sm"><i class="ri-eye-line"></i> Ver</a>
                        @if (devolvible(p)) {
                          <button type="button" class="btn btn-outline-success btn-sm" (click)="devolver(p)" [disabled]="procesando() === p.id">
                            <i class="ri-arrow-go-back-line"></i> Devolver
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="text-center text-muted py-4">No hay historial de préstamos</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    }
  `,
})
export class PrestamosInstitucionComponent {
  private readonly service = inject(PrestamosService);
  private readonly alerts = inject(AlertService);
  private readonly confirm = inject(ConfirmService);

  readonly datos = signal<MisPrestamos | null>(null);
  readonly tarjetas = signal<Tarjeta[]>([]);
  readonly procesando = signal<number | null>(null);
  readonly badge = badgePrestamoInstitucion;
  readonly devolvible = puedeDevolverse;

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.service.misPrestamos().subscribe({
      next: (d) => {
        this.datos.set(d);
        this.tarjetas.set([
          { label: 'Libros Prestados', value: d.resumen.activos, icono: 'ri-book-open-line', color: 'bg-primary-subtle text-primary' },
          { label: 'Por Devolver', value: d.resumen.porDevolver, icono: 'ri-time-line', color: 'bg-warning-subtle text-warning' },
          { label: 'Devueltos', value: d.resumen.devueltos, icono: 'ri-checkbox-circle-line', color: 'bg-success-subtle text-success' },
          { label: 'Historial Total', value: d.resumen.historialTotal, icono: 'ri-history-line', color: 'bg-info-subtle text-info' },
        ]);
      },
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message);
        this.datos.set({ hoy: '', resumen: { activos: 0, porDevolver: 0, devueltos: 0, historialTotal: 0 }, activos: [], historial: [] });
      },
    });
  }

  async devolver(p: Prestamo): Promise<void> {
    const ok = await this.confirm.ask({
      titulo: 'Registrar devolución',
      mensaje: `¿Registrar la devolución de "${p.libroTitulo ?? 'este libro'}"?`,
      textoAceptar: 'Devolver',
    });
    if (!ok) return;
    this.procesando.set(p.id);
    this.service.devolver(p.id).subscribe({
      next: () => {
        this.alerts.success('Libro devuelto exitosamente.');
        this.procesando.set(null);
        this.cargar();
      },
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message);
        this.procesando.set(null);
      },
    });
  }
}
