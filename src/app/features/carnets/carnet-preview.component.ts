import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { CarnetPreviewDatos, chipEstadoCarnet, tipoPersonaLabel } from './carnets.service';

/**
 * Vista previa del carnet digital (85:130, degradado azul) usada en el detalle,
 * la verificación pública y la impresión.
 */
@Component({
  selector: 'app-carnet-preview',
  imports: [DatePipe],
  styles: `
    .carnet {
      width: 100%;
      max-width: 320px;
      aspect-ratio: 85 / 130;
      margin: 0 auto;
      border-radius: 18px;
      padding: 18px 16px;
      color: #fff;
      background: linear-gradient(160deg, #08bdf1, #0a59cf 55%, #11bde8);
      box-shadow: 0 12px 30px rgba(10, 89, 207, 0.25);
      display: flex;
      flex-direction: column;
      font-family: 'Outfit', 'Poppins', sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .logo-box { background: #fff; border-radius: 10px; padding: 6px 12px; width: 62%; margin: 0 auto; }
    .logo-box img { width: 100%; display: block; }
    .hashtag { width: 70%; margin: 10px auto 0; display: block; }
    .nombres { font-size: 20px; font-weight: 800; text-transform: uppercase; line-height: 1.15; margin-top: 12px; text-align: center; letter-spacing: 0.5px; }
    .apellidos { font-size: 13px; text-align: center; opacity: 0.95; }
    .pill { display: inline-block; background: #fff; color: #0a59cf; font-weight: 700; font-size: 11px; letter-spacing: 1.5px; border-radius: 999px; padding: 3px 14px; margin: 8px auto 0; }
    .documento { text-align: center; font-size: 12px; margin-top: 4px; opacity: 0.95; }
    .panel { background: rgba(255, 255, 255, 0.16); border-radius: 12px; padding: 8px 12px; margin-top: 10px; font-size: 11.5px; }
    .panel-row { display: flex; justify-content: space-between; align-items: center; padding: 2px 0; }
    .chip { border-radius: 999px; padding: 1px 10px; font-weight: 700; font-size: 10.5px; color: #fff; }
    .chip.ok { background: #14d16f; }
    .chip.warn { background: #f39c12; }
    .chip.err { background: #e74c3c; }
    .chip.secondary { background: #6c757d; }
    .chip.dark { background: #212529; }
    .sep { border-top: 1px dashed rgba(255, 255, 255, 0.5); margin: 10px 0 8px; }
    .qr-box { background: #fff; border-radius: 10px; width: 112px; height: 112px; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
    .qr-box img { width: 104px; height: 104px; }
    .qr-box span { color: #0a59cf; font-size: 11px; font-weight: 700; }
    .emision { margin-top: auto; text-align: center; font-size: 10.5px; border: 1px solid rgba(255, 255, 255, 0.6); border-radius: 999px; padding: 3px 10px; }
  `,
  template: `
    @if (carnet(); as c) {
      <div class="carnet">
        <div class="logo-box"><img src="assets/images/logo_pdf1.png" alt="Comfasucre" /></div>
        <img class="hashtag" src="assets/images/caja_todos.png" alt="La Caja de Todos" />
        <div class="nombres">{{ c.nombres }}</div>
        <div class="apellidos">{{ c.apellidos }}</div>
        <div class="text-center"><span class="pill">{{ tipo(c.tipoPersona).toUpperCase() }}</span></div>
        <div class="documento">{{ c.tipoIdentificacion }} · {{ c.numeroIdentificacion }}</div>
        <div class="panel">
          <div class="panel-row"><span>Estado:</span><span class="chip" [class]="chip(c.estado)">{{ c.estado || 'Pendiente' }}</span></div>
          <div class="panel-row"><span>Vigencia:</span><strong>{{ c.vigenciaDias || 365 }} días</strong></div>
          <div class="panel-row"><span>Solicitud:</span><strong>{{ c.fechaSolicitud ? (c.fechaSolicitud | date: 'dd/MM/yyyy') : 'N/A' }}</strong></div>
          <div class="panel-row"><span>Vence:</span><strong>{{ c.fechaVencimiento ? (c.fechaVencimiento | date: 'dd/MM/yyyy') : 'Pendiente' }}</strong></div>
        </div>
        <div class="sep"></div>
        <div class="qr-box">
          @if (qrDataUrl(); as qr) { <img [src]="qr" alt="Código QR de verificación" /> } @else { <span>QR</span> }
        </div>
        <div class="emision">Fecha de emisión: {{ hoy | date: 'dd-MM-yyyy' }}</div>
      </div>
    }
  `,
})
export class CarnetPreviewComponent {
  readonly carnet = input<CarnetPreviewDatos | null>(null);
  readonly qrDataUrl = input<string | null>(null);
  readonly hoy = new Date();
  readonly tipo = tipoPersonaLabel;
  readonly chip = chipEstadoCarnet;
}
