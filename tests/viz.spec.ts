/**
 * Snapshot del DOM que emite cada renderer registrado, con valores fixture
 * representativos (incluye estados 'changed', punteros y casos borde).
 */

import { describe, expect, it } from 'vitest';
import '../src/viz';
import { renderValue, type Pointer } from '../src/viz/registry';
import { cardCells } from '../src/viz/cells';
import type { SerVal } from '../src/core/frame';

const ptr = (name: string, value: number, color = '#ffb454'): Pointer => ({ name, value, color });

const snap = (
  name: string,
  value: SerVal,
  prev?: SerVal,
  pointers: Pointer[] = [],
): string | undefined => renderValue(name, value, prev, pointers)?.outerHTML;

describe('viz renderers', () => {
  it('list con punteros y celda cambiada', () => {
    expect(
      snap(
        'nums',
        { t: 'list', v: [1, 1, 2, 2, 3], trunc: false, len: 5 },
        { t: 'list', v: [1, 1, 1, 2, 3], trunc: false, len: 5 },
        [ptr('i', 2), ptr('k', 5, '#59c2ff')],
      ),
    ).toMatchSnapshot();
  });

  it('list vacía', () => {
    expect(snap('stack', { t: 'list', v: [], trunc: false, len: 0 })).toMatchSnapshot();
  });

  it('list truncada con item anidado', () => {
    expect(
      snap('xs', {
        t: 'list',
        v: [1, { t: 'list', v: [2], trunc: false, len: 1 }],
        trunc: true,
        len: 121,
      }),
    ).toMatchSnapshot();
  });

  it('string como celdas (via cardCells)', () => {
    expect(
      cardCells('s', 'str', 'hola'.split(''), 'hole'.split(''), [ptr('i', 1)], true).outerHTML,
    ).toMatchSnapshot();
  });

  it('dict con clave cambiada', () => {
    expect(
      snap(
        'count',
        { t: 'dict', v: [['a', 2], ['b', 1]], trunc: false, len: 2 },
        { t: 'dict', v: [['a', 1], ['b', 1]], trunc: false, len: 2 },
      ),
    ).toMatchSnapshot();
  });

  it('set con elemento nuevo', () => {
    expect(
      snap(
        'seen',
        { t: 'set', v: [1, 2, 3], trunc: false, len: 3 },
        { t: 'set', v: [1, 2], trunc: false, len: 2 },
      ),
    ).toMatchSnapshot();
  });

  it('matriz con cursor i/j y celda cambiada', () => {
    expect(
      snap(
        'matrix',
        { t: 'matrix', v: [[1, 2], [3, 9]] },
        { t: 'matrix', v: [[1, 2], [3, 4]] },
        [ptr('i', 1), ptr('j', 1, '#59c2ff')],
      ),
    ).toMatchSnapshot();
  });

  it('linked list con nodo cambiado', () => {
    expect(
      snap(
        'head',
        { t: 'linkedlist', v: [1, 2, 3], cycle: false, trunc: false },
        { t: 'linkedlist', v: [1, 5, 3], cycle: false, trunc: false },
      ),
    ).toMatchSnapshot();
  });

  it('linked list con ciclo', () => {
    expect(
      snap('curr', { t: 'linkedlist', v: [1, 2], cycle: true, trunc: false }),
    ).toMatchSnapshot();
  });

  it('árbol binario con huecos', () => {
    expect(
      snap('root', { t: 'tree', v: [3, 9, 20, null, null, 15, 7] }),
    ).toMatchSnapshot();
  });

  it('árbol vacío', () => {
    expect(snap('root', { t: 'tree', v: [] })).toMatchSnapshot();
  });

  it('prev de otro tipo se ignora (sin marcas de cambio)', () => {
    expect(
      snap(
        'x',
        { t: 'set', v: [1], trunc: false, len: 1 },
        { t: 'list', v: [1], trunc: false, len: 1 },
      ),
    ).toMatchSnapshot();
  });
});
