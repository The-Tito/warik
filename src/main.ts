/** Wiring: conecta editores, runner, store de playback y renderizado. */

import './styles/main.css';
import { renderFrame, type FrameView } from './viz';
import { EXAMPLES } from './examples';
import { runTrace } from './runner/run';
import { createPlaybackStore, type Mode, type PlaybackState } from './ui/store';
import { initPlayback } from './ui/playback';
import { renderCodeView, setActiveLine } from './ui/code-view';
import { initEditors, setEditorContent, type Editors } from './ui/editor';
import { initChips } from './ui/chips';
import { initStatus } from './ui/status';

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const eds: Editors = { code: $('taCode'), test: $('taTest') };
const edCode = $('edCode');
const edTest = $('edTest');
const codeView = $('codeView');
const btnRun = $<HTMLButtonElement>('btnRun');
const btnEdit = $<HTMLButtonElement>('btnEdit');
const runMsg = $('runMsg');
const controls = $('controls');
const placeholder = $('placeholder');
const frameHead = $('frameHead');
const slider = $<HTMLInputElement>('slider');
const stepInfo = $('stepInfo');

const view: FrameView = {
  funcName: $('funcName'),
  evtBadge: $('evtBadge'),
  retBanner: $('retBanner'),
  errBanner: $('errBanner'),
  vizArea: $('vizArea'),
  consoleCard: $('consoleCard'),
  consoleOut: $('consoleOut'),
};

const store = createPlaybackStore();

initStatus($('pyStatus'), $('pyStatusTxt'));
initEditors(eds);
initChips($('chips'), EXAMPLES, (ex) => {
  setEditorContent(eds, ex.code, ex.test);
  store.set({ mode: 'edit', playing: false });
});
initPlayback(store, {
  first: $<HTMLButtonElement>('btnFirst'),
  prev: $<HTMLButtonElement>('btnPrev'),
  play: $<HTMLButtonElement>('btnPlay'),
  next: $<HTMLButtonElement>('btnNext'),
  last: $<HTMLButtonElement>('btnLast'),
  slider,
  speed: $<HTMLSelectElement>('speed'),
});

const first = EXAMPLES[0]!;
setEditorContent(eds, first.code, first.test);

function applyMode(mode: Mode): void {
  if (mode === 'play') {
    edCode.style.display = 'none';
    edTest.style.display = 'none';
    codeView.style.display = 'block';
    btnEdit.style.display = 'inline-block';
    btnRun.textContent = '↺ Re-ejecutar';
    controls.style.display = 'flex';
    placeholder.style.display = 'none';
    frameHead.style.display = 'flex';
  } else {
    edCode.style.display = 'flex';
    edTest.style.display = 'flex';
    codeView.style.display = 'none';
    btnEdit.style.display = 'none';
    btnRun.textContent = '▶ Ejecutar';
    controls.style.display = 'none';
    placeholder.style.display = 'block';
    frameHead.style.display = 'none';
    view.retBanner.style.display = 'none';
    view.errBanner.style.display = 'none';
    view.vizArea.innerHTML = '';
    view.consoleCard.style.display = 'none';
  }
}

function renderStep(s: PlaybackState): void {
  const f = s.frames[s.curr];
  if (!f || !s.meta) return;
  const prev = s.curr > 0 ? (s.frames[s.curr - 1] ?? null) : null;
  slider.value = String(s.curr);
  stepInfo.innerHTML =
    'paso <b>' + (s.curr + 1) + '</b> / ' + s.frames.length + ' · línea <b>' + f.line + '</b>';
  setActiveLine(codeView, f.line);
  renderFrame(view, f, prev, s.meta, s.curr === s.frames.length - 1);
}

store.subscribe((s, prev) => {
  if (s.mode !== prev.mode) applyMode(s.mode);
  if (s.mode !== 'play') return;
  if (s.frames !== prev.frames) slider.max = String(s.frames.length - 1);
  if (s.frames !== prev.frames || s.curr !== prev.curr || s.mode !== prev.mode) renderStep(s);
});

btnRun.onclick = async () => {
  btnRun.disabled = true;
  runMsg.textContent = 'ejecutando…';
  try {
    const { source, result } = await runTrace(eds.code.value, eds.test.value);
    if (!result.frames.length) {
      runMsg.textContent = result.error || 'no se generaron pasos';
      return;
    }
    renderCodeView(codeView, source);
    store.set({ mode: 'play', frames: result.frames, meta: result, curr: 0, playing: false });
    runMsg.textContent = '';
  } catch (e) {
    runMsg.textContent =
      'Error: ' + String(e instanceof Error ? e.message : e).slice(0, 120);
  } finally {
    btnRun.disabled = false;
  }
};

btnEdit.onclick = () => store.set({ mode: 'edit', playing: false });
