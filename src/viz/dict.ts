import { mkCard } from './card';
import { esc, fmt, valPreview } from './format';
import { registerViz } from './registry';

registerViz({
  type: 'dict',
  render({ name, value, prev }) {
    const card = mkCard(name, 'dict · ' + value.len + ' claves');
    const wrap = document.createElement('div');
    const prevMap: Record<string, string> = {};
    if (prev) for (const [k, v] of prev.v) prevMap[JSON.stringify(k)] = JSON.stringify(v);
    for (const [k, v] of value.v) {
      const key = JSON.stringify(k);
      const changed = !(key in prevMap) || prevMap[key] !== JSON.stringify(v);
      const d = document.createElement('span');
      d.className = 'drow' + (changed && prev ? ' changed' : '');
      const vHtml = v !== null && typeof v === 'object' ? esc(valPreview(v)) : fmt(v);
      d.innerHTML = '<span class="dk">' + fmt(k) + '</span><span class="dv">' + vHtml + '</span>';
      wrap.appendChild(d);
    }
    if (!value.v.length)
      wrap.innerHTML = '<span style="color:var(--faint);font-style:italic">{ } vacío</span>';
    card.appendChild(wrap);
    return card;
  },
});
