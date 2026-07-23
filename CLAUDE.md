# Warik — instrucciones del proyecto

Visualizador que **ejecuta código Python paso a paso y lo visualiza** (arrays, punteros,
diccionarios, sets, matrices, stacks, listas enlazadas y árboles cambiando en vivo). Orientado
a practicar LeetCode (Top Interview 150). Interfaz en español.

Corre **100 % en el navegador** vía **Pyodide** (Python compilado a WASM). No hay servidor ni
datos en la nube: desplegar = servir archivos estáticos.

## Comandos

```bash
npm run dev      # servidor de desarrollo (Vite, http://localhost:5173)
npm run build    # typecheck (tsc estricto) + build de producción a dist/
npm run preview  # sirve el build de producción
npm test         # tests (Vitest): snapshots del tracer y de los renderers
npm run lint     # ESLint
npm run format   # Prettier
```

## Arquitectura

Capas con dependencias en una sola dirección (`core` no depende de nadie; `ui` depende de todo):

```
src/
├─ core/     # tipos del dominio (SerVal, Frame, TraceResult). El CONTRATO tracer↔render. Sin lógica, sin DOM.
├─ tracer/   # tracer.py: instrumenta la ejecución y serializa el estado a JSON. Importado con ?raw.
├─ runner/   # Pyodide: carga (estado observable) + ejecución → Frame[] tipados. No toca el DOM.
├─ viz/      # un renderer PURO por estructura + un REGISTRY que los despacha por tipo.
├─ ui/       # editor, chips de ejemplos, controles y el store de playback (pub/sub).
└─ main.ts   # wiring / arranque.
```

### Cómo agregar una visualización nueva (la contribución estrella)

El registry (`src/viz/registry.ts`) hace que sumar una estructura sea un cambio **local**:

1. Haz que `src/tracer/tracer.py` emita un nuevo variante `{'t': 'mitipo', ...}` y añádelo a la
   unión `SerVal` en `src/core/frame.ts` (el contrato tipado).
2. Crea `src/viz/mitipo.ts` con una función pura que llame `registerViz({ type: 'mitipo', render })`.
3. Impórtalo en `src/viz/index.ts` (una línea).

No hay que tocar nada más: `render-frame.ts` despacha por tipo automáticamente. Si el tracer emite
un tipo sin renderer, la app no rompe (avisa por `console.warn`).

## Convenciones de código

- **TypeScript estricto** (`strict` + `noUncheckedIndexedAccess`). Tipa siempre la forma del frame.
- **Vanilla, sin framework de UI.** El render es imperativo (DOM/SVG); el estado va en el store propio.
- **Sin backend/BD/auth.** Persistencia con `localStorage`, compartir vía estado en la URL.
- No cambiar el look ni el comportamiento visible salvo que sea el objetivo explícito de la tarea.

## Flujo de trabajo Git — Gitflow

El repositorio sigue **Gitflow**. Ramas de larga vida:

- **`main`** — código estable y desplegable. **Solo** recibe merges de `release/*` y `hotfix/*`.
  Cada merge a `main` es una versión y lleva su tag `vX.Y.Z`. El deploy (Cloudflare Pages —
  production branch = `main`) sale de aquí. **No se commitea directo a `main`.**
- **`develop`** — rama de integración. Base de todo el trabajo diario; siempre debe compilar y pasar tests.

Ramas de apoyo (temporales):

- **`feature/<slug>`** — nace de `develop`, vuelve a `develop`. Una por unidad de trabajo.
  Para una visualización nueva usa `feature/viz-<tipo>` (p. ej. `feature/viz-graph`).
- **`release/<version>`** — nace de `develop` al preparar una versión; se estabiliza y se mergea a
  `main` (con tag) y de vuelta a `develop`.
- **`hotfix/<slug>`** — nace de `main` para un arreglo urgente; se mergea a `main` (con tag) y a `develop`.

**La integración es por Pull Request en GitHub**, no por merges locales. Los PR se mergean con
**"Create a merge commit"** (equivale a `--no-ff`: preserva la topología de la rama). Cada PR
genera un preview URL de Cloudflare Pages para revisar el cambio antes de integrarlo.

### Convención de mensajes de commit — Conventional Commits

```
tipo(scope): resumen en imperativo y minúscula
```

- **tipo**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`.
- **scope** (opcional): capa afectada — `core`, `tracer`, `runner`, `viz`, `ui`, `examples`.

Ejemplos:

```
feat(viz): agregar visualización de grafos
fix(runner): manejar timeout de carga de Pyodide
docs: añadir guía de contribución
```

Nota de shell: **no usar backticks dentro de `git commit -m "…"`** — zsh los ejecuta como comando y
se come el texto. Usar comillas simples o el editor.

### Ciclo típico de una feature

```bash
git switch develop && git pull
git switch -c feature/viz-graph
# … trabajo + commits …
npm run build && npm test          # antes de publicar
git push -u origin feature/viz-graph
gh pr create --base develop        # PR a develop; revisar el preview de Pages
```

Tras mergear el PR en GitHub, limpiar en local:

```bash
git switch develop && git pull
git branch -d feature/viz-graph
```

### Release

Cuando `develop` está listo para una versión: PR de `develop` → `main`. Al mergearlo se dispara el
deploy productivo; después se taggea la versión.

```bash
gh pr create --base main --head develop --title 'release: vX.Y.Z'
# … mergear el PR …
git switch main && git pull
git tag -a vX.Y.Z -m 'vX.Y.Z' && git push origin vX.Y.Z
```
