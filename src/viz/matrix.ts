import { mkCard } from './card';
import { fmtCell } from './format';
import { registerViz } from './registry';

// Pares de nombres de variables que, si existen como enteros, marcan un cursor [fila, col].
const CURSOR_PAIRS = [
  ['i', 'j'],
  ['r', 'c'],
  ['row', 'col'],
  ['fila', 'col'],
  ['x', 'y'],
] as const;

registerViz({
  type: 'matrix',
  render({ name, value, prev, pointers }) {
    const card = mkCard(name, 'matriz ' + value.v.length + '×' + (value.v[0] ?? []).length);
    const pv = prev ? prev.v : null;
    const cursors: [number, number][] = [];
    for (const [a, b] of CURSOR_PAIRS) {
      const pa = pointers.find((q) => q.name === a);
      const pb = pointers.find((q) => q.name === b);
      if (pa && pb) cursors.push([pa.value, pb.value]);
    }
    const t = document.createElement('table');
    t.className = 'mtx';
    let head = '<tr><td class="midx"></td>';
    for (let j = 0; j < (value.v[0] ?? []).length; j++) head += '<td class="midx">' + j + '</td>';
    let html = head + '</tr>';
    value.v.forEach((row, i) => {
      html += '<tr><td class="midx">' + i + '</td>';
      row.forEach((v, j) => {
        const changed = pv && pv[i] && JSON.stringify(pv[i]?.[j]) !== JSON.stringify(v);
        const cur = cursors.some(([a, b]) => a === i && b === j);
        html +=
          '<td class="' +
          (changed ? 'changed ' : '') +
          (cur ? 'cursor' : '') +
          '">' +
          fmtCell(v) +
          '</td>';
      });
      html += '</tr>';
    });
    t.innerHTML = html;
    card.appendChild(t);
    return card;
  },
});
