import { renderMarkdownSeguro } from './markdown.util';

describe('renderMarkdownSeguro', () => {
  it('escapa HTML y aplica estilos inline', () => {
    const html = renderMarkdownSeguro('Hola <b>mundo</b> **fuerte** `codigo`');
    expect(html).toContain('&lt;b&gt;mundo&lt;/b&gt;');
    expect(html).toContain('<strong>fuerte</strong>');
    expect(html).toContain('<code>codigo</code>');
  });

  it('convierte tablas y detecta columnas numéricas', () => {
    const html = renderMarkdownSeguro('| Libro | Total |\n|---|---|\n| A | 10 |\n| B | 2 |');
    expect(html).toContain('<table>');
    expect(html).toContain('<th class="num">Total</th>');
    expect(html).toContain('<td data-th="Libro">A</td>');
  });

  it('convierte listas, encabezados y bloques de código', () => {
    const html = renderMarkdownSeguro('# Título\n- uno\n- dos\n1. a\n2) b\n```\nSELECT 1\n```');
    expect(html).toContain('<div class="fw-semibold mt-1">Título</div>');
    expect(html).toContain('<ul><li>uno</li><li>dos</li></ul>');
    expect(html).toContain('<ol><li>a</li><li>b</li></ol>');
    expect(html).toContain('<pre>SELECT 1</pre>');
  });

  it('agrupa párrafos con saltos de línea', () => {
    expect(renderMarkdownSeguro('línea 1\nlínea 2\n\notra')).toBe('<p class="mb-1">línea 1<br>línea 2</p><p class="mb-1">otra</p>');
  });
});
