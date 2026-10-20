import { Injectable, inject, signal } from '@angular/core';
import { ApiRequestError, ApiService } from '../../core/api/api.service';
import { renderMarkdownSeguro } from './markdown.util';

export interface HerramientaUsada {
  herramienta: string;
  argumentos: unknown;
  filas: number | null;
  error: string | null;
  ms: number;
}

export interface MensajeChat {
  role: 'user' | 'assistant';
  content: string;
  html?: string;
  tools?: HerramientaUsada[];
  error?: boolean;
}

interface RespuestaAsistente {
  ok: boolean;
  respuesta: string;
  herramientas: HerramientaUsada[];
  uso: { promptTokens: number; completionTokens: number };
}

const STORE = 'bibliomovil_assistant_chat_v1';

/** Estado del chat "Ask AI"; se conserva en sessionStorage mientras dure la pestaña. */
@Injectable({ providedIn: 'root' })
export class AsistenteService {
  private readonly api = inject(ApiService);
  readonly mensajes = signal<MensajeChat[]>(this.restaurar());
  readonly enviando = signal(false);
  private conversacion = this.nuevaClave();

  nuevaConversacion(): void {
    this.conversacion = this.nuevaClave();
    this.mensajes.set([]);
    this.persistir();
  }

  preguntar(pregunta: string): void {
    if (this.enviando()) return;
    this.mensajes.update((list) => [...list, { role: 'user', content: pregunta }]);
    this.enviando.set(true);
    const historial = this.mensajes()
      .filter((m) => !m.error)
      .slice(0, -1)
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    this.api.post<RespuestaAsistente>('asistente/preguntar', { pregunta, historial, conversacion: this.conversacion }).subscribe({
      next: (res) => {
        this.mensajes.update((list) => [
          ...list,
          { role: 'assistant', content: res.respuesta, html: renderMarkdownSeguro(res.respuesta), tools: res.herramientas ?? [] },
        ]);
        this.enviando.set(false);
        this.persistir();
      },
      error: (err: ApiRequestError) => {
        const texto = err.message || 'No se pudo obtener respuesta.';
        this.mensajes.update((list) => [...list, { role: 'assistant', content: texto, html: renderMarkdownSeguro(texto), error: true }]);
        this.enviando.set(false);
        this.persistir();
      },
    });
  }

  private nuevaClave(): string {
    return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  private persistir(): void {
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ key: this.conversacion, messages: this.mensajes() }));
    } catch {
      /* sin almacenamiento */
    }
  }

  private restaurar(): MensajeChat[] {
    try {
      const raw = sessionStorage.getItem(STORE);
      if (!raw) return [];
      const data = JSON.parse(raw) as { key?: string; messages?: MensajeChat[] };
      if (data.key) this.conversacion = data.key;
      return (data.messages ?? []).map((m) => (m.role === 'assistant' ? { ...m, html: renderMarkdownSeguro(m.content) } : m));
    } catch {
      return [];
    }
  }
}
