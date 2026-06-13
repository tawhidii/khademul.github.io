// jsdom (used by Vitest) does not implement elementFromPoint. Tiptap 3.26's
// placeholder viewport-tracking calls it on editor mount via ProseMirror's
// posAtCoords, which throws without this stub. Returning null is a safe no-op.
if (typeof document !== 'undefined' && typeof document.elementFromPoint !== 'function') {
  document.elementFromPoint = () => null;
}
