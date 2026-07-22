import { esc } from './format';

/** Card contenedora con el nombre de la variable y su tipo. */
export function mkCard(name: string, type: string): HTMLDivElement {
  const c = document.createElement('div');
  c.className = 'vcard';
  c.innerHTML = '<div class="vname">' + esc(name) + ' <span class="vtype">' + type + '</span></div>';
  return c;
}
