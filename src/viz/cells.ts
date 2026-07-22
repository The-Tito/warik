/**
 * Celdas en fila: arrays, strings y stacks, con punteros (▲) debajo.
 * Registra el tipo 'list'; cardCells también lo usa render-frame.ts para
 * dibujar strings como celdas.
 */

import type { Scalar, SerVal } from '../core/frame';
import { mkCard } from './card';
import { fmtCell } from './format';
import { registerViz, type Pointer } from './registry';

export function cardCells(
  name: string,
  type: string,
  vals: (Scalar | SerVal)[],
  prevVals: (Scalar | SerVal)[] | null,
  pointers: Pointer[],
  isStr: boolean,
  trunc?: boolean,
): HTMLElement {
  const card = mkCard(name, type + (isStr ? ' · len ' + vals.length : ''));
  const row = document.createElement('div');
  row.className = 'cellrow';
  const ptrs = pointers.filter((p) => p.value >= 0 && p.value <= vals.length && p.name !== name);
  for (let i = 0; i <= vals.length; i++) {
    const isEdge = i === vals.length;
    const here = ptrs.filter((p) => p.value === i);
    if (isEdge && !here.length) break;
    const col = document.createElement('div');
    col.className =
      'cellcol' +
      (i === vals.length - 1 && !ptrs.some((p) => p.value === vals.length) ? ' last' : '') +
      (vals.length === 1 && i === 0 ? ' only' : '');
    if (isEdge) {
      col.innerHTML =
        '<div class="cell" style="opacity:.25;border-style:dashed"></div><div class="cidx">' +
        i +
        '</div>';
    } else {
      const v = vals[i] ?? null;
      const isObj = v !== null && typeof v === 'object';
      const changed = prevVals && JSON.stringify(prevVals[i]) !== JSON.stringify(v);
      col.innerHTML =
        '<div class="cell' +
        (changed ? ' changed' : '') +
        '">' +
        (isObj ? '…' : fmtCell(v)) +
        '</div><div class="cidx">' +
        i +
        '</div>';
    }
    const pd = document.createElement('div');
    pd.className = 'ptrs';
    for (const p of here) {
      const t = document.createElement('span');
      t.className = 'ptr' + (isEdge ? ' edge' : '');
      t.style.color = p.color;
      t.style.background = p.color + '22';
      t.style.border = '1px solid ' + p.color + '55';
      t.textContent = p.name;
      pd.appendChild(t);
    }
    col.appendChild(pd);
    row.appendChild(col);
  }
  if (!vals.length)
    row.innerHTML =
      '<span style="color:var(--faint);font-style:italic">' +
      (isStr ? "''" : '[ ] vacío') +
      '</span>';
  card.appendChild(row);
  if (trunc) {
    const n = document.createElement('div');
    n.className = 'trunc-note';
    n.textContent = '… mostrando los primeros 120';
    card.appendChild(n);
  }
  return card;
}

registerViz({
  type: 'list',
  render: ({ name, value, prev, pointers }) =>
    cardCells(
      name,
      'list · len ' + value.len,
      value.v,
      prev ? prev.v : null,
      pointers,
      false,
      value.trunc,
    ),
});
