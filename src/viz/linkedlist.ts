import { mkCard } from './card';
import { fmtCell } from './format';
import { registerViz } from './registry';

registerViz({
  type: 'linkedlist',
  render({ name, value, prev }) {
    const card = mkCard(name, 'linked list');
    const row = document.createElement('div');
    row.className = 'llrow';
    const pv = prev ? prev.v : null;
    value.v.forEach((v, i) => {
      if (i > 0) {
        const a = document.createElement('span');
        a.className = 'llarrow';
        a.textContent = '→';
        row.appendChild(a);
      }
      const n = document.createElement('div');
      n.className = 'llnode' + (pv && JSON.stringify(pv[i]) !== JSON.stringify(v) ? ' changed' : '');
      n.textContent = fmtCell(v);
      row.appendChild(n);
    });
    const tail = document.createElement('span');
    tail.className = 'llnull';
    tail.textContent = value.cycle ? '↺ ciclo' : value.trunc ? '→ …' : '→ None';
    row.appendChild(tail);
    card.appendChild(row);
    return card;
  },
});
