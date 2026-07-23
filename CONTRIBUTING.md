# Contribuir a Warik

¡Gracias por pasarte! Warik es un visualizador de ejecución de Python que corre **entero en el
navegador**. No hay servidor, ni base de datos, ni claves: clonas, `npm install`, y ya estás
tocando lo mismo que corre en producción.

**La contribución estrella es agregar una visualización nueva** (grafos, heaps, tablas de DP,
tries…). Está diseñada para ser un cambio **local**: tres archivos y un test. Esta guía te lleva
de la mano con un ejemplo completo y real.

---

## Índice

- [Antes de empezar](#antes-de-empezar)
- [Preparar el entorno](#preparar-el-entorno)
- [🌟 Agregar una visualización nueva](#-agregar-una-visualización-nueva) ← el tutorial
- [Anatomía de un renderer](#anatomía-de-un-renderer)
- [Otras formas de contribuir](#otras-formas-de-contribuir)
- [Convenciones de código](#convenciones-de-código)
- [Git, commits y PRs](#git-commits-y-prs)

---

## Antes de empezar

- Para **bugs** y **cambios chicos**: manda el PR directo, no hace falta ceremonia.
- Para **una visualización nueva** o cualquier cambio grande: **abre un issue primero** contando
  qué estructura quieres visualizar y cómo la imaginas dibujada. Así nos evitamos que dos personas
  hagan lo mismo, y de paso te resuelvo las dudas de diseño antes de que escribas código.
- Si buscas por dónde entrar, mira las issues con la etiqueta **`good first issue`** y el
  [roadmap del README](README.md#️-roadmap).

Se espera trato respetuoso en issues, PRs y discusiones. Nada de acoso ni ataques personales.

## Preparar el entorno

Necesitas **Node 20+** (probado en 24) y, opcionalmente, **Python 3** en el `PATH` para los tests
del tracer (si no lo tienes, esos tests se saltan solos en vez de fallar).

```bash
git clone https://github.com/The-Tito/warik.git
cd warik
npm install
npm run dev      # http://localhost:5173
```

La primera ejecución en el navegador **descarga Pyodide del CDN** (unos MB, unos segundos):
necesitas internet la primera vez. Después queda en caché.

Comandos que vas a usar:

| Comando | Qué hace |
|---|---|
| `npm run dev` | servidor de desarrollo con recarga en caliente |
| `npm test` | tests (Vitest): snapshots del tracer y de los renderers |
| `npm run build` | typecheck estricto + build de producción — **tiene que pasar antes del PR** |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## 🌟 Agregar una visualización nueva

### La idea en 30 segundos

```
tracer.py  ──JSON──>  SerVal (el contrato)  ──>  registry  ──>  tu renderer  ──>  DOM
```

1. El **tracer** (Python) mira las variables en cada paso y las serializa a JSON con una forma
   como `{ t: 'list', v: [...], len: 5 }`.
2. Esas formas están tipadas en la unión **`SerVal`** ([`src/core/frame.ts`](src/core/frame.ts)):
   **ese es el contrato** entre Python y TypeScript.
3. El **registry** ([`src/viz/registry.ts`](src/viz/registry.ts)) despacha cada valor al renderer
   registrado para su `t`.

Por eso agregar una estructura son **tres cambios** (más el test): emitirla, tiparla, dibujarla.

### El ejemplo: `collections.deque`

Vamos a hacerlo de verdad con un caso que hoy falta. Si escribes esto en Warik:

```python
from collections import deque
q = deque([1, 2, 3])
q.popleft()
```

`q` se dibuja como texto plano `deque([2, 3])`, porque el tracer no reconoce el tipo y cae en el
fallback `raw`. Y `deque` aparece en cada BFS del Top Interview 150, así que vale la pena. Vamos.

---

### Paso 0 — comprueba que el tracer puede distinguir tu tipo

**Este es el paso que más gente se salta y el que más duele.** El tracer solo ve objetos de Python
en runtime; si tu estructura no es distinguible por su tipo, no puedes emitir un variante nuevo sin
más:

| Estructura | ¿Distinguible? | Qué hacer |
|---|---|---|
| `deque`, `ListNode`, `TreeNode` | ✅ `isinstance` basta | camino feliz, sigue el tutorial |
| **Heap** (`heapq`) | ❌ es una `list` normal | hace falta heurística o marcarlo de otra forma |
| **Grafo** (lista de adyacencia) | ❌ es un `dict` de listas | idem |
| **Tabla de DP** | ⚠️ es una lista de listas → ya sale como `matrix` | quizá solo necesites mejorar `matrix` |

Si caes en ❌, **abre un issue antes de escribir código**: la decisión de cómo detectarlo (heurística
por forma, por nombre de variable, o una anotación explícita del usuario) es de diseño y hay que
acordarla. `deque` es ✅, así que seguimos.

Para comprobarlo, corre el tracer directo sobre un snippet, sin navegador:

```bash
python3 -c "
import json
ns = {}
exec(open('src/tracer/tracer.py').read(), ns)
out = json.loads(ns['run_trace']('from collections import deque\nq = deque([1,2,3])\n'))
print(json.dumps(out['frames'][-1]['locals'], indent=1))
"
```

```jsonc
{ "q": { "t": "raw", "v": "deque([1, 2, 3])" } }   // ← confirmado: cae en raw
```

Este truco es **tu mejor herramienta de depuración** en todo el proceso: iteras sobre el JSON en un
segundo, sin arrancar Pyodide.

---

### Paso 1 — que el tracer emita el variante

En [`src/tracer/tracer.py`](src/tracer/tracer.py), la función `_ser` es una cadena de `isinstance`.
Añade tu rama **antes del fallback `raw` del final** (y antes de tipos más genéricos que podrían
capturarla primero):

```python
import sys, json, io, collections        # ← collections es nuevo

# … dentro de _ser(v, depth), justo antes de:  if isinstance(v, (list, tuple)):

    if isinstance(v, collections.deque):
        items = [(_scalar(x) if _is_scalar(x) else _ser(x, depth + 1)) for x in list(v)[:MAX_ITEMS]]
        return {'t': 'deque', 'v': items, 'trunc': len(v) > MAX_ITEMS, 'len': len(v)}
```

Reglas de oro del tracer:

- **Respeta los límites.** `MAX_ITEMS` (120) y `MAX_DEPTH` (4) existen para que una estructura
  gigante no cuelgue el navegador. Corta con `[:MAX_ITEMS]` y reporta `trunc`/`len`.
- **Nada de fallar.** Si tu rama puede lanzar, el `try` de `serialize()` te salva con un `raw`,
  pero mejor no llegar ahí.
- **Solo JSON.** Lo que devuelvas tiene que ser serializable: dicts, listas, números, strings,
  booleanos, `None`.
- **Usa `_scalar(x)`** para los valores hoja: normaliza `NaN`, infinitos y objetos raros.

Vuelve a correr el snippet del Paso 0. Ahora debería decir:

```jsonc
{ "q": { "t": "deque", "v": [1, 2, 3], "trunc": false, "len": 3 } }
```

---

### Paso 2 — añade el tipo al contrato

En [`src/core/frame.ts`](src/core/frame.ts), declara la interfaz y súmala a la unión `SerVal`.
**La forma tiene que coincidir exactamente con lo que emite el tracer.**

```ts
/** collections.deque — misma forma que ListVal. */
export interface DequeVal {
  t: 'deque';
  v: (Scalar | SerVal)[];
  trunc: boolean;
  len: number;
}

export type SerVal =
  | ScalarVal
  | ListVal
  | DictVal
  | DequeVal   // ← nuevo
  | SetVal
  | MatrixVal
  | LinkedListVal
  | TreeVal
  | RawVal;
```

En cuanto agregas el miembro a la unión, TypeScript te va a ir señalando dónde falta cubrirlo.
El proyecto está en modo **estricto** (`strict` + `noUncheckedIndexedAccess`): nada de `any`.

---

### Paso 3 — escribe el renderer

Crea `src/viz/deque.ts`. Un renderer es una **función pura**: recibe un contexto y **devuelve** un
`HTMLElement`. No consulta el DOM, no muta nada de fuera, no guarda estado entre llamadas.

```ts
/** collections.deque — celdas en fila, igual que una lista. */

import { cardCells } from './cells';
import { registerViz } from './registry';

registerViz({
  type: 'deque',
  render: ({ name, value, prev, pointers }) =>
    cardCells(
      name,
      'deque · len ' + value.len,
      value.v,
      prev ? prev.v : null,
      pointers,
      false,
      value.trunc,
    ),
});
```

En este caso reusamos [`cardCells`](src/viz/cells.ts), el helper de "celdas en fila con punteros"
que ya usan las listas y los strings. **Reusar es lo correcto cuando encaja**: Warik se ve
coherente porque las estructuras comparten vocabulario visual. Si tu estructura necesita otro
layout (un árbol, un grafo), escribe el DOM/SVG a mano — mira
[`tree.ts`](src/viz/tree.ts) como ejemplo de eso.

---

### Paso 4 — regístralo

Una línea en [`src/viz/index.ts`](src/viz/index.ts):

```ts
import './cells';
import './dict';
import './deque';   // ← nuevo
import './set';
```

**Y ya está.** No hay que tocar `render-frame.ts`, ni el runner, ni la UI. Si el tracer emitiera un
tipo sin renderer, la app no rompe: avisa por `console.warn` y sigue.

---

### Paso 5 — el test

Los renderers se testean con **snapshots del HTML** que producen, en
[`tests/viz.spec.ts`](tests/viz.spec.ts). Añade al menos un caso con un `prev` distinto (para
ejercitar el marcado de "cambió") y otro con el caso vacío:

```ts
it('deque con elemento consumido', () => {
  expect(
    snap(
      'q',
      { t: 'deque', v: [2, 3], trunc: false, len: 2 },
      { t: 'deque', v: [1, 2, 3], trunc: false, len: 3 },
    ),
  ).toMatchSnapshot();
});

it('deque vacía', () => {
  expect(snap('q', { t: 'deque', v: [], trunc: false, len: 0 })).toMatchSnapshot();
});
```

```bash
npm test                 # crea los snapshots nuevos la primera vez
```

**Revisa el snapshot generado** en `tests/__snapshots__/` antes de commitearlo: es el HTML real que
va a ver la gente, y es tu oportunidad de detectar que se te coló algo raro. Commitéalo junto con
tu código.

Si tu cambio en `tracer.py` altera los snapshots del tracer, mira bien el diff: o es intencional
(actualízalos con `npx vitest run -u` y revisa que `core/frame.ts` siga en sync) o rompiste el
contrato sin querer.

---

### Paso 6 — míralo en el navegador

```bash
npm run dev
```

Pega un caso de prueba que use tu estructura y avanza paso a paso. Comprueba:

- [ ] se dibuja bien en el **primer** paso (sin `prev`) y en los siguientes;
- [ ] el caso **vacío** no se ve roto;
- [ ] una estructura **grande** (>120 elementos) muestra el aviso de truncado y no cuelga nada;
- [ ] `npm run build` (typecheck estricto), `npm test` y `npm run lint` pasan.

Si vale la pena, agrega también un ejemplo del Top 150 que la use en
[`src/examples/index.ts`](src/examples/index.ts) — así tu visualización se descubre sola.

## Anatomía de un renderer

Lo que recibes (`RenderContext`, en [`src/viz/registry.ts`](src/viz/registry.ts)):

| Campo | Qué es |
|---|---|
| `name` | nombre de la variable (`"nums"`) |
| `value` | tu variante de `SerVal`, ya **estrechado a tu tipo** por el registry |
| `prev` | el valor en el paso anterior, o `null` si no existía o cambió de tipo — úsalo para marcar lo que cambió |
| `pointers` | todos los enteros del frame (`i`, `j`, `k`…) con un color asignado, para dibujar cursores |

Helpers que te conviene conocer antes de reinventarlos:

- [`mkCard(name, type)`](src/viz/card.ts) — la card contenedora con título. **Úsala siempre**, es
  lo que hace que todo se vea uniforme.
- [`cardCells(...)`](src/viz/cells.ts) — celdas en fila con punteros `▲` debajo.
- [`fmt`, `fmtCell`, `esc`, `valPreview`](src/viz/format.ts) — formato estilo Python y **escapado de
  HTML**.

⚠️ **Si metes texto en `innerHTML`, pásalo por `esc()`.** Los nombres de variables y los valores
vienen del código del usuario; sin escapar, un string con `<` te rompe el render.

Clases CSS ya definidas en [`src/styles/main.css`](src/styles/main.css) — reúsalas en vez de
inventar estilos: `.vcard`, `.vname`, `.cellrow`, `.cellcol`, `.cell`, `.cidx`, `.ptr`, `.ptrs`,
`.schip`, `.drow`, `.llnode`, `.trunc-note`, y el modificador **`.changed`** para resaltar lo que
cambió respecto al paso anterior. Colores: las variables CSS `--bg`, `--text`, `--amber`, `--mono`.

Reglas:

- **Puro y sin estado.** Se te llama en cada paso; devuelve un elemento nuevo cada vez.
- **Sin dependencias nuevas.** Vanilla DOM/SVG. Warik no tiene framework de UI y así se queda.
- **Sin red, sin `localStorage`, sin `document.querySelector`.** Tu renderer solo construye nodos.
- **Interfaz en español**, incluidos los textos de estado vacío.

## Otras formas de contribuir

No todo es dibujar estructuras:

- **Ejemplos nuevos del Top Interview 150** — un objeto `{ name, code, test }` en
  [`src/examples/index.ts`](src/examples/index.ts). Que sea corto (que quepa en pantalla) y que
  luzca una estructura. Ojo: cada ejemplo genera un snapshot del tracer.
- **Bugs** — si algo se dibuja mal, el mejor reporte incluye el snippet de Python exacto.
- **Accesibilidad, contraste, teclado** — hay margen.
- **Documentación** — si algo de esta guía te confundió, arreglarlo *es* una contribución.

## Convenciones de código

- **TypeScript estricto.** Nada de `any`; tipa la forma del frame.
- **Vanilla.** Render imperativo (DOM/SVG); el estado vive en el store pub/sub propio de `ui/`.
- **Dependencias en una sola dirección**: `core` no depende de nadie → `tracer`/`runner` → `viz` →
  `ui`. Un renderer **nunca** importa de `ui/`.
- **Sin backend, sin auth, sin base de datos.** Persistencia con `localStorage`, compartir vía URL.
- **No cambies el look ni el comportamiento existente** si no es el objetivo explícito de tu PR.
- Deja que **Prettier** decida el formato: `npm run format`.

## Git, commits y PRs

Seguimos **Gitflow**. Lo único que necesitas saber para contribuir:

> **Las ramas salen de `develop` y el PR va contra `develop`.** Nunca contra `main` (`main` es
> producción y solo recibe releases).

```bash
git switch develop && git pull
git switch -c feature/viz-deque
# … trabajo …
git push -u origin feature/viz-deque
# y abres el PR a develop desde GitHub
```

Nombra la rama `feature/viz-<tipo>` para una visualización, o `fix/<slug>` para un arreglo.

**Mensajes de commit** — [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(scope): resumen en imperativo y minúscula
```

- **tipo**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`.
- **scope** (opcional): la capa tocada — `core`, `tracer`, `runner`, `viz`, `ui`, `examples`.

```
feat(viz): agregar visualización de deque
fix(runner): manejar timeout de carga de Pyodide
docs: añadir guía de contribución
```

### Checklist del PR

- [ ] `npm run build` pasa (typecheck estricto incluido)
- [ ] `npm test` pasa, con los snapshots nuevos revisados y commiteados
- [ ] `npm run lint` limpio
- [ ] Lo probaste en el navegador (`npm run dev`), incluidos los casos vacío y grande
- [ ] El PR va contra **`develop`**
- [ ] Describes **qué** visualizas y **por qué**; una captura o un GIF vale oro en este proyecto

Cada PR genera un **preview deploy** automático en Cloudflare Pages, así que vas a poder mandar el
link de tu visualización funcionando. 🎉

---

¿Dudas? Abre un [Issue](https://github.com/The-Tito/warik/issues) o pasa por
[Discussions](https://github.com/The-Tito/warik/discussions). Gracias por contribuir.
