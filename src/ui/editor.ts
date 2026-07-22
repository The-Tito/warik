/** Textareas de solución y caso de prueba (Tab inserta 4 espacios). */

export interface Editors {
  code: HTMLTextAreaElement;
  test: HTMLTextAreaElement;
}

export function initEditors(eds: Editors): void {
  for (const ta of [eds.code, eds.test]) {
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ta.selectionStart;
        ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(ta.selectionEnd);
        ta.selectionStart = ta.selectionEnd = s + 4;
      }
    });
  }
}

export function setEditorContent(eds: Editors, code: string, test: string): void {
  eds.code.value = code;
  eds.test.value = test;
}
