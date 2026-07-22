import type { Scalar, SerVal } from '../core/frame';

export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Representación estilo Python de un escalar ('None', 'True', "'txt'"…). */
export const fmt = (v: Scalar): string =>
  v === null
    ? 'None'
    : typeof v === 'boolean'
      ? v
        ? 'True'
        : 'False'
      : typeof v === 'string'
        ? "'" + esc(v) + "'"
        : esc(String(v));

/** Versión compacta para celdas (None → '·', booleanos → T/F). */
export const fmtCell = (v: Scalar): string =>
  v === null ? '·' : typeof v === 'boolean' ? (v ? 'T' : 'F') : esc(String(v));

/** Resumen de una línea de cualquier SerVal (banner de return, valores anidados). */
export function valPreview(s: SerVal | undefined): string {
  if (!s) return '?';
  if (s.t === 'scalar') return fmt(s.v);
  if (s.t === 'list')
    return '[' + s.v.map((x) => (typeof x === 'object' && x ? '…' : fmt(x))).join(', ') + ']';
  if (s.t === 'linkedlist') return s.v.join(' → ') + ' → None';
  if (s.t === 'matrix') return 'matriz ' + s.v.length + '×' + (s.v[0] ?? []).length;
  if (s.t === 'dict')
    return (
      '{' +
      s.v
        .map((kv) => fmt(kv[0]) + ': …')
        .join(', ')
        .slice(0, 40) +
      '}'
    );
  if (s.t === 'set') return '{' + s.v.map(fmt).join(', ') + '}';
  if (s.t === 'tree') return 'árbol';
  return esc(String(s.v));
}
