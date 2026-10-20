import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { AlertService } from '../../core/ui/alert.service';
import { ConfirmService } from '../../shared/components/confirm.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { PaginatedMeta, PaginationComponent } from '../../shared/components/pagination.component';
import { EstadoBadgePipe } from '../../shared/pipes/estado-badge.pipe';
import { AtajoRango, fechaIso, rangoAtajo, validarRango } from './rango-fechas.util';
import { ESTADOS_SOLICITUD, EstadoSolicitud, Solicitud, SolicitudesService } from './solicitudes.service';

@Component({
  selector: 'app-solicitudes-list',
  imports: [FormsModule, RouterLink, DatePipe, PageTitleComponent, LoadingComponent, PaginationComponent, ModalComponent, EstadoBadgePipe],
  template: `
    <app-page-title titulo="Módulo de Solicitudes" documento="Solicitudes">
      @if (!auth.hasRole('administrador')) {
        <a routerLink="/solicitudes/nueva" class="btn btn-primary btn-sm"><i class="ri-add-line me-1"></i>Nueva Solicitud</a>
      } @else {
        <button type="button" class="btn btn-danger btn-sm" (click)="abrirDescarga()"><i class="ri-file-pdf-line me-1"></i>Descargar</button>
      }
    </app-page-title>

    <div class="card">
      <div class="card-header"><h5 class="card-title">Solicitudes Registradas</h5></div>
      <div class="card-body">
        <form class="row g-2 align-items-center mb-3" (submit)="buscar($event)">
          <div class="col-md-6">
            <div class="input-group">
              <input type="search" class="form-control" [(ngModel)]="q" name="q" placeholder="Buscar por institución o representante..." />
              @if (q) {
                <button type="button" class="btn btn-outline-secondary" (click)="limpiar()" aria-label="Limpiar"><i class="ri-close-line"></i></button>
              }
              <button type="submit" class="btn btn-primary"><i class="ri-search-line me-1"></i>Buscar</button>
            </div>
          </div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="estado" name="estado" (ngModelChange)="cargar(1)">
              <option value="">Todos los estados</option>
              @for (e of estados; track e) { <option [value]="e">{{ e }}</option> }
            </select>
          </div>
          <div class="col-md-3 text-md-end">
            @if (meta(); as m) { <span class="badge bg-light-purple text-primary">{{ m.total }} resultado(s)</span> }
          </div>
        </form>

        @if (cargando()) {
          <app-loading />
        } @else {
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr><th>ID</th><th>Institución</th><th>Representante</th><th>Municipio</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                @for (s of items(); track s.id) {
                  <tr>
                    <td>{{ s.id }}</td>
                    <td class="fw-semibold">{{ s.nombreInstitucion }}</td>
                    <td>{{ s.nombreRepresentante }}</td>
                    <td>{{ s.municipio }}</td>
                    <td><span [class]="s.estado | estadoBadge">{{ s.estado }}</span></td>
                    <td>{{ s.createdAt | date: 'dd/MM/yyyy' }}</td>
                    <td>
                      <div class="d-flex gap-1 flex-wrap">
                        <a [routerLink]="['/solicitudes', s.id]" class="btn btn-outline-primary btn-sm"><i class="ri-eye-line"></i> Ver</a>
                        @if (auth.hasRole('administrador') && s.estado === 'Pendiente') {
                          <button type="button" class="btn btn-success btn-sm" (click)="aprobar(s)"><i class="ri-check-line"></i> Aprobar</button>
                          <button type="button" class="btn btn-danger btn-sm" (click)="abrirRechazo(s)"><i class="ri-close-line"></i> Rechazar</button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="7" class="text-center text-muted py-4">No se encontraron solicitudes.</td></tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination [meta]="meta()" (cambiar)="cargar($event)" />
        }
      </div>
    </div>

    <app-modal [abierto]="!!rechazo()" titulo="Motivo de rechazo" (cerrar)="rechazo.set(null)">
      <form id="formRechazo" (submit)="rechazar($event)">
        <label class="form-label">Indique el motivo por el cual rechaza la solicitud *</label>
        <textarea class="form-control" rows="4" [(ngModel)]="motivoRechazo" name="motivoRechazo" [class.is-invalid]="motivoTocado && !motivoRechazo.trim()"></textarea>
        @if (motivoTocado && !motivoRechazo.trim()) { <div class="invalid-feedback d-block">Debe indicar el motivo de rechazo.</div> }
      </form>
      <div modal-footer class="modal-footer">
        <button type="button" class="btn btn-light" (click)="rechazo.set(null)">Cancelar</button>
        <button type="submit" form="formRechazo" class="btn btn-danger" [disabled]="procesando()">Rechazar Solicitud</button>
      </div>
    </app-modal>

    <app-modal [abierto]="modalDescarga()" titulo="Descargar solicitudes" (cerrar)="modalDescarga.set(false)">
      <form id="formDescarga" (submit)="descargar($event)">
        <p class="text-muted">Seleccione el rango de fechas que desea descargar. Puede ser una semana, un mes o cualquier rango personalizado.</p>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Fecha inicio *</label>
            <input type="date" class="form-control" [(ngModel)]="fechaInicio" name="fechaInicio" [max]="hoy" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Fecha fin *</label>
            <input type="date" class="form-control" [(ngModel)]="fechaFin" name="fechaFin" [max]="hoy" />
          </div>
        </div>
        <div class="d-flex gap-2 flex-wrap mt-3">
          <button type="button" class="btn btn-outline-secondary btn-sm" (click)="atajo('hoy')">Hoy</button>
          <button type="button" class="btn btn-outline-secondary btn-sm" (click)="atajo('semana')">Esta semana</button>
          <button type="button" class="btn btn-outline-secondary btn-sm" (click)="atajo('mes')">Este mes</button>
          <button type="button" class="btn btn-outline-secondary btn-sm" (click)="atajo('mesAnterior')">Mes anterior</button>
        </div>
        @if (errorDescarga()) { <div class="alert alert-danger mt-3 mb-0 py-2">{{ errorDescarga() }}</div> }
      </form>
      <div modal-footer class="modal-footer">
        <button type="button" class="btn btn-light" (click)="modalDescarga.set(false)">Cancelar</button>
        <button type="submit" form="formDescarga" class="btn btn-danger"><i class="ri-file-pdf-line me-1"></i>Descargar PDF</button>
      </div>
    </app-modal>
  `,
})
export class SolicitudesListComponent {
  readonly auth = inject(AuthService);
  private readonly service = inject(SolicitudesService);
  private readonly alerts = inject(AlertService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);

  readonly estados = ESTADOS_SOLICITUD;
  readonly items = signal<Solicitud[]>([]);
  readonly meta = signal<PaginatedMeta | null>(null);
  readonly cargando = signal(true);
  readonly procesando = signal(false);
  readonly rechazo = signal<Solicitud | null>(null);
  readonly modalDescarga = signal(false);
  readonly errorDescarga = signal<string | null>(null);

  q = '';
  estado: EstadoSolicitud | '' = '';
  motivoRechazo = '';
  motivoTocado = false;
  readonly hoy = fechaIso(new Date());
  fechaInicio = rangoAtajo('mes').inicio;
  fechaFin = this.hoy;

  constructor() {
    this.cargar(1);
  }

  cargar(page: number): void {
    this.cargando.set(true);
    this.service.listar({ q: this.q, estado: this.estado, page }).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.meta.set(res.meta);
        this.cargando.set(false);
      },
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message);
        this.cargando.set(false);
      },
    });
  }

  buscar(event: Event): void {
    event.preventDefault();
    this.cargar(1);
  }

  limpiar(): void {
    this.q = '';
    this.cargar(1);
  }

  async aprobar(s: Solicitud): Promise<void> {
    const ok = await this.confirm.ask({ titulo: 'Aprobar solicitud', mensaje: `¿Aprobar la solicitud #${s.id} de ${s.nombreInstitucion}?`, textoAceptar: 'Aprobar' });
    if (!ok) return;
    this.service.aprobar(s.id).subscribe({
      next: () => {
        this.alerts.success('Solicitud aprobada correctamente.');
        this.cargar(this.meta()?.page ?? 1);
      },
      error: (err: ApiRequestError) => this.alerts.error(err.message),
    });
  }

  abrirRechazo(s: Solicitud): void {
    this.motivoRechazo = '';
    this.motivoTocado = false;
    this.rechazo.set(s);
  }

  rechazar(event: Event): void {
    event.preventDefault();
    this.motivoTocado = true;
    const s = this.rechazo();
    const motivo = this.motivoRechazo.trim();
    if (!s || !motivo) return;
    this.procesando.set(true);
    this.service.rechazar(s.id, motivo).subscribe({
      next: () => {
        this.procesando.set(false);
        this.rechazo.set(null);
        this.alerts.success('Solicitud rechazada correctamente.');
        this.cargar(this.meta()?.page ?? 1);
      },
      error: (err: ApiRequestError) => {
        this.procesando.set(false);
        this.rechazo.set(null);
        this.alerts.error(err.message);
      },
    });
  }

  abrirDescarga(): void {
    this.errorDescarga.set(null);
    this.modalDescarga.set(true);
  }

  atajo(a: AtajoRango): void {
    const r = rangoAtajo(a);
    this.fechaInicio = r.inicio;
    this.fechaFin = r.fin;
    this.errorDescarga.set(null);
  }

  descargar(event: Event): void {
    event.preventDefault();
    const error = validarRango(this.fechaInicio, this.fechaFin);
    this.errorDescarga.set(error);
    if (error) return;
    this.modalDescarga.set(false);
    void this.router.navigate(['/solicitudes/reporte'], { queryParams: { fechaInicio: this.fechaInicio, fechaFin: this.fechaFin } });
  }
}
