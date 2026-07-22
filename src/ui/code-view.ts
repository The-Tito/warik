/** Visor de código con highlight de sintaxis y línea activa durante el playback. */

import { esc } from '../viz/format';

function hlLine(line: string): string {
  const e = esc(line);
  const re =
    /(#.*$)|(&quot;(?:[^&]|&(?!quot;))*?&quot;|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(def|class|return|if|elif|else|for|while|in|not|and|or|None|True|False|break|continue|import|from|del|lambda|pass|yield|with|as|try|except|finally|raise|is)\b|\b(len|range|print|max|min|sorted|enumerate|abs|sum|set|dict|list|str|int|float|reversed|zip|map|filter)\b(?=\()|\b(\d+\.?\d*)\b/g;
  return e.replace(re, (m, c?: string, s?: string, k?: string, b?: string, n?: string) => {
    if (c) return '<span class="tk-c">' + c + '</span>';
    if (s) return '<span class="tk-s">' + s + '</span>';
    if (k) return '<span class="tk-k">' + k + '</span>';
    if (b) return '<span class="tk-b">' + b + '</span>';
    if (n) return '<span class="tk-n">' + n + '</span>';
    return m;
  });
}

export function renderCodeView(container: HTMLElement, src: string): void {
  const lines = src.split('\n');
  container.innerHTML = lines
    .map(
      (l, i) =>
        '<div class="cl" id="L' + (i + 1) + '"><span class="ln">' + (i + 1) +
        '</span><span class="lc">' + (hlLine(l) || ' ') + '</span></div>',
    )
    .join('');
}

export function setActiveLine(container: HTMLElement, line: number): void {
  container.querySelectorAll('.cl.active').forEach((el) => el.classList.remove('active'));
  const ln = container.querySelector('#L' + line);
  if (ln) {
    ln.classList.add('active');
    ln.scrollIntoView({ block: 'nearest' });
  }
}
