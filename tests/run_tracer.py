# Harness CLI para correr el tracer con CPython local (sin Pyodide).
# Lee el código fuente por stdin y escribe el JSON del trace por stdout.
# Lo usan los tests de snapshot (tests/tracer.spec.ts).

import sys
import pathlib

TRACER = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'tracer' / 'tracer.py'

ns = {}
exec(compile(TRACER.read_text(), str(TRACER), 'exec'), ns)

src = sys.stdin.read()
print(ns['run_trace'](src))
