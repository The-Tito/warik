/**
 * Importar este módulo registra todos los renderers.
 * ¿Agregas una visualización nueva? Crea su módulo y súmalo aquí (una línea).
 */

import './cells';
import './dict';
import './set';
import './matrix';
import './linkedlist';
import './tree';

export { renderFrame, type FrameView } from './render-frame';
export { registerViz, renderValue, type Pointer, type RenderContext, type VizRenderer } from './registry';
