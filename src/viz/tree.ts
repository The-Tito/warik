import { mkCard } from './card';
import { fmtCell } from './format';
import { registerViz } from './registry';

registerViz({
  type: 'tree',
  render({ name, value }) {
    const card = mkCard(name, 'árbol binario');
    const vals = value.v;
    if (!vals.length) {
      card.innerHTML += '<span style="color:var(--faint);font-style:italic">None</span>';
      return card;
    }
    const depth = Math.floor(Math.log2(vals.length)) + 1;
    const W = Math.min(640, Math.max(240, Math.pow(2, depth - 1) * 64));
    const H = depth * 62 + 20;
    const pos = (i: number) => {
      const d = Math.floor(Math.log2(i + 1));
      const k = i - (Math.pow(2, d) - 1);
      return { x: ((k + 0.5) / Math.pow(2, d)) * W, y: d * 62 + 26 };
    };
    let edges = '';
    let nodes = '';
    vals.forEach((v, i) => {
      if (v === null) return;
      const { x, y } = pos(i);
      for (const c of [2 * i + 1, 2 * i + 2]) {
        if (c < vals.length && vals[c] !== null) {
          const q = pos(c);
          edges +=
            '<line x1="' + x + '" y1="' + y + '" x2="' + q.x + '" y2="' + q.y +
            '" stroke="#2e3750" stroke-width="1.5"/>';
        }
      }
      nodes +=
        '<circle cx="' + x + '" cy="' + y + '" r="17" fill="#151923" stroke="#59c2ff" stroke-width="1.5"/>' +
        '<text x="' + x + '" y="' + (y + 4) +
        '" text-anchor="middle" fill="#d7dce6" font-size="12" font-family="IBM Plex Mono">' +
        fmtCell(v) + '</text>';
    });
    card.innerHTML +=
      '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;max-width:' + W +
      'px;display:block">' + edges + nodes + '</svg>';
    return card;
  },
});
