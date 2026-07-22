/**
 * Ejecución: (código, caso de prueba) → TraceResult tipado.
 * Sin DOM. Los errores del código Python del usuario NO lanzan: llegan en
 * `result.error` (el tracer los captura). Solo lanza por fallos de
 * infraestructura (red / carga de Pyodide).
 */

import type { TraceResult } from '../core/frame';
import { ensurePyodide, type Pyodide } from './pyodide-loader';
import tracerSource from '../tracer/tracer.py?raw';

const SEP = '\n\n# ── caso de prueba ──\n';

/** Une solución + caso de prueba tal como se muestra luego en el visor de código. */
export function combineSource(code: string, test: string): string {
  return code.replace(/\t/g, '    ') + SEP + test.replace(/\t/g, '    ');
}

let tracerLoadedOn: Pyodide | null = null;

export interface RunResult {
  /** Fuente combinada que se ejecutó (para el visor de código). */
  source: string;
  result: TraceResult;
}

export async function runTrace(code: string, test: string): Promise<RunResult> {
  const py = await ensurePyodide();
  if (tracerLoadedOn !== py) {
    await py.runPythonAsync(tracerSource);
    tracerLoadedOn = py;
  }
  const source = combineSource(code, test);
  py.globals.set('SRC', source);
  const raw = await py.runPythonAsync('run_trace(SRC)');
  return { source, result: JSON.parse(String(raw)) as TraceResult };
}
