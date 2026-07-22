/** Chips de ejemplos precargados. */

import type { Example } from '../examples';

export function initChips(
  container: HTMLElement,
  examples: readonly Example[],
  onSelect: (ex: Example) => void,
): void {
  for (const ex of examples) {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = ex.name;
    b.onclick = () => onSelect(ex);
    container.appendChild(b);
  }
}
