/**
 * Carga perezosa de Pyodide (viene del <script> CDN en index.html).
 * El estado de carga es observable para que la UI muestre el indicador
 * sin que este módulo toque el DOM.
 */

export interface Pyodide {
  globals: { set(name: string, value: unknown): void };
  runPythonAsync(code: string): Promise<unknown>;
}

declare global {
  interface Window {
    loadPyodide(options?: Record<string, unknown>): Promise<Pyodide>;
  }
}

export type PyodideStatus = 'idle' | 'loading' | 'ready' | 'error';

let instance: Pyodide | null = null;
let pending: Promise<Pyodide> | null = null;
let status: PyodideStatus = 'idle';
const listeners = new Set<(status: PyodideStatus) => void>();

function setStatus(next: PyodideStatus): void {
  status = next;
  for (const fn of listeners) fn(status);
}

/** Suscribe y notifica inmediatamente con el estado actual. Devuelve unsubscribe. */
export function onPyodideStatus(fn: (status: PyodideStatus) => void): () => void {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

export function ensurePyodide(): Promise<Pyodide> {
  if (instance) return Promise.resolve(instance);
  if (!pending) {
    setStatus('loading');
    pending = window
      .loadPyodide()
      .then((py) => {
        instance = py;
        setStatus('ready');
        return py;
      })
      .catch((err: unknown) => {
        pending = null;
        setStatus('error');
        throw err;
      });
  }
  return pending;
}
