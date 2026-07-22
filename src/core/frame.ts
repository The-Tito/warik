/**
 * Contrato entre el tracer de Python (src/tracer/tracer.py) y el resto de la app.
 *
 * El tracer serializa el estado de las variables locales en cada paso de la
 * ejecución a JSON con estas formas exactas. Si cambias algo aquí, tiene que
 * cambiar en tracer.py (y viceversa) — los tests de snapshot del tracer
 * (tests/tracer.spec.ts) existen para detectar esa deriva.
 */

/** Valor escalar tal como llega del JSON del tracer. */
export type Scalar = null | boolean | number | string;

export interface ScalarVal {
  t: 'scalar';
  v: Scalar;
}

/** Lista/tupla. Los items no escalares llegan serializados de forma anidada. */
export interface ListVal {
  t: 'list';
  v: (Scalar | SerVal)[];
  trunc: boolean;
  len: number;
}

/** Dict como pares [clave, valor]; valores no escalares llegan anidados. */
export interface DictVal {
  t: 'dict';
  v: [Scalar, Scalar | SerVal][];
  trunc: boolean;
  len: number;
}

export interface SetVal {
  t: 'set';
  v: Scalar[];
  trunc: boolean;
  len: number;
}

/** Lista de listas de escalares, todas no vacías. */
export interface MatrixVal {
  t: 'matrix';
  v: Scalar[][];
}

/** Cadena de ListNode aplanada a sus valores. */
export interface LinkedListVal {
  t: 'linkedlist';
  v: Scalar[];
  cycle: boolean;
  trunc: boolean;
}

/** Árbol binario aplanado por niveles (null = hueco), sin nulls finales. */
export interface TreeVal {
  t: 'tree';
  v: (Scalar | null)[];
}

/** Fallback: repr() del valor. */
export interface RawVal {
  t: 'raw';
  v: string;
}

export type SerVal =
  | ScalarVal
  | ListVal
  | DictVal
  | SetVal
  | MatrixVal
  | LinkedListVal
  | TreeVal
  | RawVal;

export type TraceEvent = 'call' | 'line' | 'return';

/** Un paso de la ejecución. */
export interface Frame {
  line: number;
  event: TraceEvent;
  /** Nombre de la función, o '<module>' para el nivel superior. */
  func: string;
  locals: Record<string, SerVal>;
  /** Longitud acumulada de stdout al momento de este paso. */
  out: number;
  /** Valor retornado; solo presente cuando event === 'return'. */
  ret?: SerVal;
}

export interface TraceResult {
  frames: Frame[];
  stdout: string;
  /** 'TipoDeError: mensaje' si el código del usuario lanzó una excepción. */
  error: string | null;
  /** true si la ejecución superó el máximo de pasos y se cortó. */
  truncated: boolean;
}
