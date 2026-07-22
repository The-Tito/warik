/**
 * Orquestador: dibuja un paso completo de la ejecución.
 * Resuelve lo transversal entre variables (punteros, agrupado de escalares,
 * banners de return/error, consola) y despacha cada estructura a su renderer
 * registrado. Los renderers individuales viven en los demás módulos de viz/.
 */

import type { Frame, RawVal, ScalarVal, SerVal, TraceResult } from '../core/frame';
import { mkCard } from './card';
import { cardCells } from './cells';
import { esc, fmt, valPreview } from './format';
import { renderValue, type Pointer } from './registry';

const PTR_COLORS = ['#ffb454', '#59c2ff', '#c2d94c', '#f07178', '#d2a6ff', '#95e6cb'];

/** Elementos del panel derecho sobre los que se dibuja cada paso. */
export interface FrameView {
  funcName: HTMLElement;
  evtBadge: HTMLElement;
  retBanner: HTMLElement;
  errBanner: HTMLElement;
  vizArea: HTMLElement;
  consoleCard: HTMLElement;
  consoleOut: HTMLElement;
}

export function renderFrame(
  view: FrameView,
  f: Frame,
  prev: Frame | null,
  meta: TraceResult,
  isLast: boolean,
): void {
  view.funcName.textContent = f.func === '<module>' ? 'caso de prueba' : f.func + '()';
  const badge = view.evtBadge;
  badge.className = f.event === 'return' ? 'ret' : f.event === 'call' ? 'call' : '';
  badge.textContent =
    f.event === 'return' ? 'return' : f.event === 'call' ? 'llamada' : 'línea ' + f.line;

  const rb = view.retBanner;
  if (f.event === 'return' && f.ret) {
    rb.style.display = 'block';
    rb.innerHTML =
      '↩ ' +
      (f.func === '<module>'
        ? 'fin del programa'
        : esc(f.func) + '() retorna → <b>' + valPreview(f.ret) + '</b>');
  } else rb.style.display = 'none';

  const eb = view.errBanner;
  if (meta.error && isLast) {
    eb.style.display = 'block';
    eb.textContent = '✕ ' + meta.error;
  } else eb.style.display = 'none';

  // Solo comparamos contra el paso anterior si seguimos en la misma función.
  const prevLoc: Record<string, SerVal> = prev && prev.func === f.func ? prev.locals : {};

  // Punteros: enteros del frame que pueden estar indexando una estructura.
  const pointers: Pointer[] = [];
  let ci = 0;
  for (const [name, s] of Object.entries(f.locals)) {
    if (s.t === 'scalar' && typeof s.v === 'number' && Number.isInteger(s.v)) {
      pointers.push({ name, value: s.v, color: PTR_COLORS[ci++ % PTR_COLORS.length]! });
    }
  }

  const area = view.vizArea;
  area.innerHTML = '';
  const scalarEntries: [string, ScalarVal | RawVal, SerVal | undefined][] = [];

  for (const [name, s] of Object.entries(f.locals)) {
    const p = prevLoc[name];
    if (s.t === 'scalar') {
      // Strings cortos se dibujan como celdas indexables; el resto va a la card de escalares.
      if (typeof s.v === 'string' && s.v.length >= 2 && s.v.length <= 60) {
        area.appendChild(
          cardCells(
            name,
            'str',
            s.v.split(''),
            p && p.t === 'scalar' && typeof p.v === 'string' ? p.v.split('') : null,
            pointers,
            true,
          ),
        );
      } else {
        scalarEntries.push([name, s, p]);
      }
    } else if (s.t === 'raw') {
      scalarEntries.push([name, s, p]);
    } else {
      const el = renderValue(name, s, p, pointers);
      if (el) area.appendChild(el);
      else console.warn('[viz] sin renderer registrado para el tipo "' + s.t + '"');
    }
  }

  if (scalarEntries.length) {
    const card = mkCard('variables', 'escalares');
    const row = document.createElement('div');
    row.className = 'scalars';
    for (const [name, s, p] of scalarEntries) {
      const changed = p && JSON.stringify(p.v) !== JSON.stringify(s.v);
      const d = document.createElement('span');
      d.className = 'sc' + (changed ? ' changed' : '');
      const ptr = pointers.find((x) => x.name === name);
      d.innerHTML =
        '<span class="sk"' +
        (ptr ? ' style="color:' + ptr.color + '"' : '') +
        '>' +
        esc(name) +
        '</span><span class="sv">' +
        fmt(s.v) +
        '</span>';
      row.appendChild(d);
    }
    card.appendChild(row);
    area.appendChild(card);
  }

  const out = meta.stdout.slice(0, f.out);
  if (out) {
    view.consoleCard.style.display = 'block';
    view.consoleOut.textContent = out;
  } else view.consoleCard.style.display = 'none';

  if (meta.truncated && isLast) {
    const n = document.createElement('div');
    n.className = 'trunc-note';
    n.textContent = '⚠ ejecución truncada a 4000 pasos — usa un input más pequeño para verla completa';
    area.appendChild(n);
  }
}
