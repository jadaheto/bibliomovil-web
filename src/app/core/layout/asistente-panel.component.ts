import { Component, ElementRef, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { AsistenteService, MensajeChat } from '../../features/asistente/asistente.service';

/** Panel lateral "Ask AI" (solo administradores). Replica el offcanvas del sistema original. */
@Component({
  selector: 'app-asistente-panel',
  template: `
    @if (abierto()) {
      <div class="modal-backdrop-custom" (click)="cerrar.emit()"></div>
    }
    <div class="offcanvas offcanvas-end" id="bmAssistant" [class.show]="abierto()" [class.ca-wide]="ancho()" tabindex="-1" [style.visibility]="abierto() ? 'visible' : 'hidden'">
      <div class="offcanvas-header">
        <div class="ca-title"><i class="ri-sparkling-2-line me-1 text-primary"></i> Nueva conversación</div>
        <div class="d-flex align-items-center gap-1">
          <button type="button" class="btn btn-sm btn-icon" title="Nueva conversación" (click)="chat.nuevaConversacion()"><i class="ri-add-line fs-18"></i></button>
          <button type="button" class="btn btn-sm btn-icon d-none d-md-inline-flex" title="Ampliar" (click)="ancho.set(!ancho())"><i class="ri-expand-diagonal-line fs-16"></i></button>
          <button type="button" class="btn btn-sm btn-icon" title="Cerrar" (click)="cerrar.emit()"><i class="ri-close-line fs-18"></i></button>
        </div>
      </div>
      <div class="offcanvas-body ca-body">
        <div class="ca-scroll" #scroll>
          @if (chat.mensajes().length === 0) {
            <div class="ca-hero">
              <div class="ca-orb"></div>
              <h4>{{ saludo() }}, {{ auth.primerNombre() }}.</h4>
              <p>¿Qué revisamos hoy?</p>
            </div>
            @for (s of sugerencias; track s.titulo) {
              <button type="button" class="ca-suggest" (click)="sugerir(s.q)">
                <i [class]="s.icono"></i>
                <span><strong>{{ s.titulo }}</strong><small>{{ s.detalle }}</small></span>
              </button>
            }
          }
          @for (m of chat.mensajes(); track $index) {
            @if (m.role === 'user') {
              <div class="ca-msg user">{{ m.content }}</div>
            } @else {
              <div class="ca-msg bot" [class.error]="m.error" [class.has-table]="m.html?.includes('<table')" [innerHTML]="m.html"></div>
              @if (m.tools?.length) {
                <div class="ca-tools"><i class="ri-database-2-line"></i> Consultó:
                  @for (t of m.tools; track $index) {{{ t.herramienta }} ({{ t.filas ?? '-' }}){{ $last ? '' : ', ' }}}
                </div>
              }
            }
          }
          @if (chat.enviando()) {
            <div class="ca-msg bot ca-typing"><span></span><span></span><span></span></div>
          }
        </div>
        @if (!avisoCerrado()) {
          <div class="ca-notice">
            <span>Las conversaciones se guardan para auditoría. El asistente solo consulta datos, no modifica nada.</span>
            <button type="button" class="btn-close btn-close-sm" aria-label="Cerrar aviso" (click)="avisoCerrado.set(true)"></button>
          </div>
        }
        <form class="ca-compose" (submit)="enviar($event)">
          <textarea
            #input
            rows="1"
            placeholder="Pregunta por una institución, un libro, préstamos, solicitudes o actividades…"
            [value]="texto()"
            (input)="texto.set(input.value)"
            (keydown.enter)="onEnter($event)"
          ></textarea>
          <div class="ca-compose-bar">
            <span class="ca-ask"><i class="ri-quill-pen-line me-1"></i>Preguntar</span>
            <button type="submit" class="ca-send" [class.ready]="texto().trim().length > 0" [disabled]="chat.enviando()" aria-label="Enviar">
              <i class="ri-arrow-up-line fs-18"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      #bmAssistant { --ca-w: 460px; --ca-surface: #fff; --ca-canvas: #f3f3f9; --ca-raise: #f3f6f9; --ca-border: #e9ebec; --ca-text: #212529; --ca-muted: #878a99; --ca-heading: #495057; --ca-primary: #5c59e8; --ca-danger: #f06548;
        width: var(--ca-w); max-width: 100vw; border-left: 1px solid var(--ca-border); background-color: var(--ca-surface); color: var(--ca-text); z-index: 1060; transition: transform 0.3s ease; }
      #bmAssistant.ca-wide { --ca-w: 760px; }
      :host-context([data-bs-theme='dark']) #bmAssistant { --ca-surface: #212529; --ca-canvas: #1a1d21; --ca-raise: #2a2f34; --ca-border: #32383e; --ca-text: #ced4da; --ca-muted: #8f9bb3; --ca-heading: #f3f6f9; }
      #bmAssistant .offcanvas-header { border-bottom: 1px solid var(--ca-border); padding: 0.75rem 1rem; }
      #bmAssistant .ca-title { font-weight: 600; font-size: 1rem; color: var(--ca-heading); }
      #bmAssistant .btn-icon { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; padding: 0 !important; color: var(--ca-muted); }
      #bmAssistant .btn-icon:hover { color: var(--ca-primary); background-color: var(--ca-raise); }
      #bmAssistant .ca-body { display: flex; flex-direction: column; height: 100%; padding: 0; }
      #bmAssistant .ca-scroll { flex: 1 1 auto; overflow-y: auto; overflow-x: hidden; padding: 1rem; background-color: var(--ca-canvas); background-image: radial-gradient(var(--ca-border) 1px, transparent 1px); background-size: 14px 14px; }
      #bmAssistant .ca-hero { text-align: center; padding: 1.5rem 0.5rem 1rem; }
      #bmAssistant .ca-orb { width: 104px; height: 104px; margin: 0 auto 1rem; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #ffd9b3 0%, #ffb27a 45%, #ff9553 100%); box-shadow: 0 18px 40px rgba(255, 149, 83, 0.35); }
      #bmAssistant .ca-hero h4 { margin: 0 0 0.25rem; font-weight: 600; color: var(--ca-heading); }
      #bmAssistant .ca-hero p { color: var(--ca-muted); margin: 0; }
      #bmAssistant .ca-suggest { display: flex; align-items: center; gap: 0.75rem; width: 100%; text-align: left; margin-top: 0.6rem; padding: 0.75rem 0.9rem; border: 1px solid var(--ca-border); border-radius: 0.6rem; background-color: var(--ca-surface); color: var(--ca-text); cursor: pointer; }
      #bmAssistant .ca-suggest:hover { border-color: var(--ca-primary); }
      #bmAssistant .ca-suggest i { font-size: 1.15rem; color: var(--ca-muted); }
      #bmAssistant .ca-suggest small { display: block; color: var(--ca-muted); }
      #bmAssistant .ca-msg { max-width: 92%; margin-bottom: 0.85rem; padding: 0.65rem 0.85rem; border-radius: 0.75rem; line-height: 1.45; font-size: 0.9rem; overflow-wrap: anywhere; word-break: break-word; white-space: pre-wrap; }
      #bmAssistant .ca-msg.has-table { max-width: 100%; width: 100%; }
      #bmAssistant .ca-msg.user { margin-left: auto; background-color: var(--ca-primary); color: #fff; border-bottom-right-radius: 0.2rem; }
      #bmAssistant .ca-msg.bot { margin-right: auto; background-color: var(--ca-surface); border: 1px solid var(--ca-border); border-bottom-left-radius: 0.2rem; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); white-space: normal; }
      #bmAssistant .ca-msg.bot :is(p) { margin: 0 0 0.35rem; }
      #bmAssistant .ca-msg.bot table { width: 100%; table-layout: fixed; font-size: 0.8rem; margin: 0.4rem 0; border-collapse: collapse; }
      #bmAssistant .ca-msg.bot th, #bmAssistant .ca-msg.bot td { border: 1px solid var(--ca-border); padding: 0.25rem 0.35rem !important; text-align: left; vertical-align: top; font-size: 0.8rem !important; text-transform: none !important; background: transparent !important; }
      #bmAssistant .ca-msg.bot th { background-color: var(--ca-raise) !important; font-weight: 600; }
      #bmAssistant .ca-msg.bot td.num, #bmAssistant .ca-msg.bot th.num { text-align: right; white-space: nowrap; }
      #bmAssistant .ca-msg.bot ul, #bmAssistant .ca-msg.bot ol { padding-left: 1.2rem; margin: 0.3rem 0; }
      #bmAssistant .ca-msg.bot pre { white-space: pre-wrap; background-color: var(--ca-raise); border-radius: 0.4rem; padding: 0.5rem 0.6rem; font-size: 0.8rem; margin: 0.4rem 0; }
      #bmAssistant .ca-msg.bot code { background-color: var(--ca-raise); padding: 0 0.3rem; border-radius: 0.25rem; }
      #bmAssistant .ca-msg.error { border-color: var(--ca-danger); color: var(--ca-danger); }
      #bmAssistant .ca-tools { margin: -0.5rem 0 0.85rem; font-size: 0.72rem; color: var(--ca-muted); }
      #bmAssistant .ca-typing span { display: inline-block; width: 6px; height: 6px; margin-right: 3px; border-radius: 50%; background: var(--ca-muted); animation: caBlink 1.2s infinite; }
      #bmAssistant .ca-typing span:nth-child(2) { animation-delay: 0.2s; } #bmAssistant .ca-typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes caBlink { 0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; } }
      #bmAssistant .ca-notice { margin: 0.75rem 1rem 0; padding: 0.6rem 0.8rem; border: 1px solid var(--ca-border); border-radius: 0.6rem; font-size: 0.78rem; color: var(--ca-muted); background-color: var(--ca-raise); display: flex; justify-content: space-between; gap: 0.5rem; }
      #bmAssistant .ca-compose { margin: 0.75rem 1rem 1rem; border: 1.5px solid var(--ca-border); border-radius: 0.8rem; background-color: var(--ca-surface); padding: 0.6rem 0.75rem; }
      #bmAssistant .ca-compose:focus-within { border-color: var(--ca-primary); box-shadow: 0 0 0 0.2rem rgba(92, 89, 232, 0.15); }
      #bmAssistant .ca-compose textarea { width: 100%; border: 0; outline: 0; resize: none; background: transparent; color: var(--ca-text); font-size: 0.92rem; max-height: 160px; }
      #bmAssistant .ca-compose-bar { display: flex; align-items: center; justify-content: space-between; margin-top: 0.4rem; }
      #bmAssistant .ca-ask { border: 1px solid var(--ca-border); border-radius: 999px; padding: 0.15rem 0.7rem; font-size: 0.8rem; }
      #bmAssistant .ca-send { width: 34px; height: 34px; border-radius: 50%; border: 0; background-color: var(--ca-primary); color: #fff; opacity: 0.55; display: inline-flex; align-items: center; justify-content: center; }
      #bmAssistant .ca-send.ready { opacity: 1; }
      @media (max-width: 575.98px) { #bmAssistant { --ca-w: 100vw; } }
    `,
  ],
})
export class AsistentePanelComponent {
  readonly auth = inject(AuthService);
  readonly chat = inject(AsistenteService);
  readonly abierto = input(false);
  readonly cerrar = output<void>();
  readonly ancho = signal(false);
  readonly texto = signal('');
  readonly avisoCerrado = signal(false);
  private readonly scroll = viewChild<ElementRef<HTMLDivElement>>('scroll');
  private readonly inputRef = viewChild<ElementRef<HTMLTextAreaElement>>('input');

  readonly sugerencias = [
    { icono: 'ri-building-2-line', titulo: 'Ficha de institución', detalle: 'Solicitudes, actividades, préstamos y carnets de un colegio', q: 'Dame la ficha y el resumen de la institución ' },
    { icono: 'ri-alarm-warning-line', titulo: 'Préstamos vencidos', detalle: 'Libros sin devolver, por institución y días de retraso', q: '¿Qué préstamos están vencidos, de qué instituciones y cuántos días de retraso llevan? Ordena de mayor a menor retraso.' },
    { icono: 'ri-mail-open-line', titulo: 'Solicitudes pendientes', detalle: 'Visitas por aprobar, institución y antigüedad', q: '¿Qué solicitudes de visita están pendientes de aprobar y desde cuándo? Incluye institución, municipio y participantes.' },
    { icono: 'ri-calendar-check-line', titulo: 'Actividades del mes', detalle: 'Jornadas, municipios, participantes y pendientes de evaluar', q: 'Resume las actividades de este mes: cuántas se hicieron, en qué municipios, cuántos participantes en total y cuáles siguen sin evaluar.' },
  ];

  constructor() {
    effect(() => {
      this.chat.mensajes();
      this.chat.enviando();
      queueMicrotask(() => {
        const el = this.scroll()?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
    effect(() => {
      if (this.abierto()) queueMicrotask(() => this.inputRef()?.nativeElement.focus());
    });
  }

  saludo(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  }

  sugerir(q: string): void {
    if (q.endsWith(' ')) {
      this.texto.set(q);
      this.inputRef()?.nativeElement.focus();
    } else {
      this.chat.preguntar(q);
    }
  }

  onEnter(event: Event): void {
    const e = event as KeyboardEvent;
    if (e.shiftKey) return;
    e.preventDefault();
    this.enviar(event);
  }

  enviar(event: Event): void {
    event.preventDefault();
    const q = this.texto().trim();
    if (!q || this.chat.enviando()) return;
    this.texto.set('');
    this.chat.preguntar(q);
  }

  protected trackMensaje(_: number, m: MensajeChat): MensajeChat {
    return m;
  }
}
