/**
 * Mini-renderizador de Markdown seguro (escapa HTML antes de convertir):
 * bloques de código, tablas, listas, encabezados, párrafos y estilos inline.
 * Equivalente al `md()` del panel original.
 */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

const NUMERICO = /^[-–+]?\s*\$?\s*[\d.,]+\s*%?$/;

function tabla(lineas: string[]): string {
  const filas = lineas
    .filter((l) => !/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(l))
    .map((l) => l.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()));
  if (filas.length === 0) return '';
  const [cab, ...cuerpo] = filas;
  const numericas = cab.map((_, i) =>
    cuerpo.length > 0 && cuerpo.every((f) => !f[i] || f[i] === '-' || f[i] === '—' || NUMERICO.test(f[i])),
  );
  const cls = cab.length > 7 ? ' class="ca-cols-gt7"' : cab.length > 4 ? ' class="ca-cols-gt4"' : '';
  const th = cab.map((c, i) => `<th${numericas[i] ? ' class="num"' : ''}>${inline(c)}</th>`).join('');
  const tr = cuerpo
    .map((f) => `<tr>${cab.map((_, i) => `<td data-th="${cab[i]}"${numericas[i] ? ' class="num"' : ''}>${inline(f[i] ?? '')}</td>`).join('')}</tr>`)
    .join('');
  return `<table${cls}><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

export function renderMarkdownSeguro(src: string): string {
  const lineas = esc(src ?? '').split(/\r?\n/);
  const out: string[] = [];
  let i = 0;
  while (i < lineas.length) {
    const l = lineas[i];
    if (l.startsWith('```')) {
      const buf: string[] = [];
      i++;
      while (i < lineas.length && !lineas[i].startsWith('```')) buf.push(lineas[i++]);
      i++;
      out.push(`<pre>${buf.join('\n')}</pre>`);
      continue;
    }
    if (l.trim().startsWith('|')) {
      const buf: string[] = [];
      while (i < lineas.length && lineas[i].trim().startsWith('|')) buf.push(lineas[i++].trim());
      out.push(tabla(buf));
      continue;
    }
    if (/^\s*[-*•]\s+/.test(l)) {
      const buf: string[] = [];
      while (i < lineas.length && /^\s*[-*•]\s+/.test(lineas[i])) buf.push(lineas[i++].replace(/^\s*[-*•]\s+/, ''));
      out.push(`<ul>${buf.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(l)) {
      const buf: string[] = [];
      while (i < lineas.length && /^\s*\d+[.)]\s+/.test(lineas[i])) buf.push(lineas[i++].replace(/^\s*\d+[.)]\s+/, ''));
      out.push(`<ol>${buf.map((x) => `<li>${inline(x)}</li>`).join('')}</ol>`);
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(l);
    if (h) {
      out.push(`<div class="fw-semibold mt-1">${inline(h[2])}</div>`);
      i++;
      continue;
    }
    if (l.trim() === '') {
      i++;
      continue;
    }
    const buf: string[] = [];
    while (i < lineas.length && lineas[i].trim() !== '' && !/^(```|\s*\||\s*[-*•]\s+|\s*\d+[.)]\s+|#{1,6}\s)/.test(lineas[i])) {
      buf.push(lineas[i++]);
    }
    out.push(`<p class="mb-1">${buf.map(inline).join('<br>')}</p>`);
  }
  return out.join('');
}
