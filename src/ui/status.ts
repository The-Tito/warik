/** Indicador de estado de Pyodide en el header. */

import { onPyodideStatus, type PyodideStatus } from '../runner/pyodide-loader';

const TEXTS: Record<PyodideStatus, string> = {
  idle: 'Python: sin cargar',
  loading: 'Python: descargando…',
  ready: 'Python: listo',
  error: 'Python: error de red',
};

const CLASSES: Record<PyodideStatus, string> = {
  idle: '',
  loading: 'loading',
  ready: 'ready',
  error: '',
};

export function initStatus(box: HTMLElement, txt: HTMLElement): void {
  onPyodideStatus((s) => {
    box.className = CLASSES[s];
    txt.textContent = TEXTS[s];
  });
}
