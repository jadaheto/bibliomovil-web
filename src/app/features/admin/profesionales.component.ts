import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiRequestError, ApiService } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { ConfirmService } from '../../shared/components/confirm.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { ESTADOS_PROFESIONAL } from '../../shared/constants/catalogos';

export interface Profesional {
  id: number;
  usuarioId: number;
  nombreCompleto: string;
  documento: string;
  cargo: string;
  correo: string;
  telefono: string;
  municipioBase: string | null;
  estado: 'activo' | 'inactivo' | 'suspendido';
  estadoUsuario: string;
  createdAt: string;
}

@Component({
  selector: 'app-profesionales',
  imports: [FormsModule, RouterLink, DatePipe, PageTitleComponent, LoadingComponent],
  template: `
    <app-page-title titulo="Gestión de Usuarios">
      <a routerLink="/admin/usuarios/nuevo" class="btn btn-primary btn-sm"><i class="ri-user-add-line me-1"></i>Nuevo Profesional</a>
    </app-page-title>

    <div class="card">
      <div class="card-header"><h5 class="card-title">Profesionales Registrados</h5></div>
      <div class="card-body">
        @if (cargando()) {
          <app-loading />
        } @else {
          <div class="table-responsive">
            <table class="table table-hover align-middle table-nowrap mb-0">
              <thead class="table-light">
                <tr><th>ID</th><th>Nombre Completo</th><th>Documento</th><th>Cargo</th><th>Correo</th><th>Teléfono</th><th>Municipio Base</th><th>Estado</th><th>Fecha Registro</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                @for (p of items(); track p.id) {
                  <tr>
                    <td>{{ p.id }}</td>
                    <td class="fw-semibold">{{ p.nombreCompleto }}</td>
                    <td>{{ p.documento }}</td>
                    <td>{{ p.cargo }}</td>
                    <td>{{ p.correo }}</td>
                    <td>{{ p.telefono }}</td>
                    <td>{{ p.municipioBase || 'No especificado' }}</td>
                    <td>
                      <select class="form-select form-select-sm" style="width: auto" [ngModel]="p.estado" (ngModelChange)="cambiarEstado(p, $event)" [name]="'e' + p.id">
                        @for (e of estados; track e.value) { <option [value]="e.value">{{ e.label }}</option> }
                      </select>
                    </td>
                    <td>{{ p.createdAt | date: 'dd/MM/yyyy' }}</td>
                    <td>
                      <div class="d-flex gap-1">
                        <a [routerLink]="['/admin/usuarios', p.id, 'editar']" class="btn btn-outline-primary btn-sm"><i class="ri-edit-line"></i> Editar</a>
                        <button type="button" class="btn btn-outline-danger btn-sm" (click)="eliminar(p)"><i class="ri-delete-bin-line"></i> Eliminar</button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="10" class="text-center text-muted py-4">No hay profesionales registrados.</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export class ProfesionalesComponent {
  private readonly api = inject(ApiService);
  private readonly alerts = inject(AlertService);
  private readonly confirm = inject(ConfirmService);
  readonly estados = ESTADOS_PROFESIONAL;
  readonly items = signal<Profesional[]>([]);
  readonly cargando = signal(true);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.api.get<Profesional[]>('admin/profesionales').subscribe({
      next: (list) => {
        this.items.set(list);
        this.cargando.set(false);
      },
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message);
        this.cargando.set(false);
      },
    });
  }

  cambiarEstado(p: Profesional, estado: Profesional['estado']): void {
    this.api.patch(`admin/profesionales/${p.id}/estado`, { estado }).subscribe({
      next: () => {
        p.estado = estado;
        this.alerts.success('Estado actualizado correctamente.');
      },
      error: (err: ApiRequestError) => this.alerts.error(err.message || 'Error al actualizar el estado.'),
    });
  }

  async eliminar(p: Profesional): Promise<void> {
    const ok = await this.confirm.ask({ titulo: 'Eliminar profesional', mensaje: '¿Eliminar este profesional? Esta acción no se puede deshacer.', textoAceptar: 'Eliminar', peligro: true });
    if (!ok) return;
    this.api.delete(`admin/profesionales/${p.id}`).subscribe({
      next: () => {
        this.alerts.success('Profesional eliminado correctamente.');
        this.cargar();
      },
      error: (err: ApiRequestError) => this.alerts.error(err.message || 'Error al eliminar el profesional.'),
    });
  }
}
