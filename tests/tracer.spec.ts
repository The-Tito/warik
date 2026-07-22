// @vitest-environment node
/**
 * Snapshot del contrato del tracer: por cada ejemplo, ejecuta tracer.py con
 * el python3 local y congela el JSON de frames. Si tocas tracer.py y esto
 * cambia, o es intencional (actualiza el snapshot y revisa core/frame.ts)
 * o rompiste el contrato.
 *
 * Nota: Pyodide 0.26 usa Python 3.12; el python3 local puede diferir en
 * versión. Los snapshots se generan/verifican siempre contra el mismo
 * python3 local, así que sirven como regresión aunque no sean idénticos
 * bit a bit a lo que emite Pyodide.
 */

import { describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { EXAMPLES } from '../src/examples';
import { combineSource } from '../src/runner/run';
import type { TraceResult } from '../src/core/frame';

const HARNESS = fileURLToPath(new URL('./run_tracer.py', import.meta.url));
const hasPython = spawnSync('python3', ['--version']).status === 0;

function trace(code: string, test: string): TraceResult {
  const out = execFileSync('python3', [HARNESS], {
    input: combineSource(code, test),
    encoding: 'utf-8',
    timeout: 30_000,
  });
  return JSON.parse(out) as TraceResult;
}

describe.skipIf(!hasPython)('tracer (snapshot por ejemplo)', () => {
  if (!hasPython) console.warn('python3 no encontrado — tests del tracer omitidos');

  for (const ex of EXAMPLES) {
    it(ex.name, () => {
      const result = trace(ex.code, ex.test);
      expect(result.error).toBeNull();
      expect(result.truncated).toBe(false);
      expect(result.frames.length).toBeGreaterThan(0);
      expect(result).toMatchSnapshot();
    });
  }

  it('excepción del usuario → error con frames parciales', () => {
    const result = trace(
      'class Solution:\n    def f(self, xs):\n        return xs[99]',
      'resultado = Solution().f([1, 2])',
    );
    expect(result.error).toBe('IndexError: list index out of range');
    expect(result.frames.length).toBeGreaterThan(0);
  });

  it('ejecución larga → truncada a MAX_STEPS', () => {
    const result = trace('total = 0\nfor i in range(5000):\n    total += i', '');
    expect(result.truncated).toBe(true);
    expect(result.frames.length).toBe(4000);
  });
});
