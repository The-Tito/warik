import { mkCard } from './card';
import { fmt } from './format';
import { registerViz } from './registry';

registerViz({
  type: 'set',
  render({ name, value, prev }) {
    const card = mkCard(name, 'set · ' + value.len);
    const wrap = document.createElement('div');
    const prevSet = new Set(prev ? prev.v.map((x) => JSON.stringify(x)) : []);
    for (const v of value.v) {
      const d = document.createElement('span');
      d.className = 'schip' + (prev && !prevSet.has(JSON.stringify(v)) ? ' changed' : '');
      d.innerHTML = fmt(v);
      wrap.appendChild(d);
    }
    if (!value.v.length)
      wrap.innerHTML = '<span style="color:var(--faint);font-style:italic">set() vacío</span>';
    card.appendChild(wrap);
    return card;
  },
});
