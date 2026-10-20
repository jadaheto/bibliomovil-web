import { DatePipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiRequestError } from '../../core/api/api.service';
import { AlertService } from '../../core/ui/alert.service';
import { LoadingComponent } from '../../shared/components/loading.component';
import { PageTitleComponent } from '../../shared/components/page-title.component';
import { CarnetPreviewComponent } from './carnet-preview.component';
import { Carnet, CarnetsService, badgeCarnet, etiquetaTipoIdentificacion, tipoPersonaLabel } from './carnets.service';

/** Detalle del carnet con vista previa, QR, impresión y descarga del QR. */
@Component({
  selector: 'app-carnet-detail',
  imports: [DatePipe, RouterLink, PageTitleComponent, LoadingComponent, CarnetPreviewComponent],
  templateUrl: './carnet-detail.component.html',
  styles: `
    .seccion-titulo { font-size: 12px; letter-spacing: 1px; text-transform: uppercase; font-weight: 700; color: #6c757d; margin: 0 0 10px; }
    @media print {
      .card, .card-body { border: 0 !important; box-shadow: none !important; padding: 0 !important; }
      .col-impresion { flex: 0 0 100% !important; max-width: 100% !important; }
    }
  `,
})
export class CarnetDetailComponent {
  private readonly service = inject(CarnetsService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  readonly carnet = signal<Carnet | null>(null);
  readonly qrDataUrl = signal<string | null>(null);
  readonly tipo = tipoPersonaLabel;
  readonly badge = badgeCarnet;
  readonly etiquetaTipoId = etiquetaTipoIdentificacion;

  ngOnInit(): void {
    this.service.obtener(this.id()).subscribe({
      next: (c) => this.carnet.set(c),
      error: (err: ApiRequestError) => {
        this.alerts.error(err.message || 'Carnet no encontrado.');
        void this.router.navigate(['/carnets/historial']);
      },
    });
    // El QR lo genera el endpoint público de verificación (mismo destino que el código impreso).
    this.service.verificar(this.id()).subscribe({
      next: (p) => this.qrDataUrl.set(p.qrDataUrl),
      error: () => this.qrDataUrl.set(null),
    });
  }

  imprimir(): void {
    window.print();
  }

  nombreArchivoQr(c: Carnet): string {
    const base = `${c.nombres}_${c.apellidos}`.replace(/[^a-zA-Z0-9]/g, '_');
    return `Carnet_${base}_QR.png`;
  }
}
