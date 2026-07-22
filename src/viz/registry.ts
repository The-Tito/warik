/**
 * Registry de visualizaciones — la pieza clave para contribuir.
 *
 * Cada tipo de estructura que emite el tracer (ver SerVal en core/frame.ts)
 * tiene un renderer puro: (contexto) => HTMLElement. Para agregar una
 * visualización nueva:
 *
 *   1. Haz que el tracer emita un nuevo variante {t: 'mitipo', ...} y súmalo
 *      a la unión SerVal en core/frame.ts.
 *   2. Crea src/viz/mitipo.ts que llame registerViz({type: 'mitipo', render}).
 *   3. Impórtalo en src/viz/index.ts (una línea).
 *
 * Nada más que tocar: el orquestador (render-frame.ts) despacha por tipo.
 */

import type { SerVal } from '../core/frame';

/** Variable entera del frame, candidata a puntero/índice, con color asignado. */
export interface Pointer {
  name: string;
  value: number;
  color: string;
}

export type VizType = SerVal['t'];
export type ValueOf<K extends VizType> = Extract<SerVal, { t: K }>;

export interface RenderContext<K extends VizType = VizType> {
  /** Nombre de la variable. */
  name: string;
  value: ValueOf<K>;
  /** Valor en el paso anterior, o null si no existía o cambió de tipo. */
  prev: ValueOf<K> | null;
  /** Todos los enteros del frame (para dibujar punteros/cursores). */
  pointers: Pointer[];
}

export interface VizRenderer<K extends VizType = VizType> {
  type: K;
  render(ctx: RenderContext<K>): HTMLElement;
}

const registry = new Map<VizType, VizRenderer>();

export function registerViz<K extends VizType>(renderer: VizRenderer<K>): void {
  registry.set(renderer.type, renderer as unknown as VizRenderer);
}

/** Despacha al renderer del tipo; null si no hay ninguno registrado. */
export function renderValue(
  name: string,
  value: SerVal,
  prev: SerVal | undefined,
  pointers: Pointer[],
): HTMLElement | null {
  const renderer = registry.get(value.t);
  if (!renderer) return null;
  const matchedPrev = prev && prev.t === value.t ? prev : null;
  return renderer.render({ name, value, prev: matchedPrev, pointers });
}
