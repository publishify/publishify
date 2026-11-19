import { type Range } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";

/** Focus mode: the line with the cursor is crisp and a touch larger, the rest of its paragraph softer, everything else fades; the cursor stays in the middle of the screen (typewriter). */
function build(view: EditorView): DecorationSet {
  const { state } = view;
  const head = state.doc.lineAt(state.selection.main.head).number;
  let from = head;
  let to = head;
  while (from > 1 && state.doc.line(from - 1).text.trim() !== "") from--;
  while (to < state.doc.lines && state.doc.line(to + 1).text.trim() !== "")
    to++;
  const dim = Decoration.line({ class: "cm-dim" });
  const para = Decoration.line({ class: "cm-para" });
  const here = Decoration.line({ class: "cm-here" });
  const decos: Range<Decoration>[] = [];
  for (const r of view.visibleRanges) {
    const a = state.doc.lineAt(r.from).number;
    const b = state.doc.lineAt(r.to).number;
    for (let n = a; n <= b; n++)
      decos.push(
        (n < from || n > to ? dim : n === head ? here : para).range(state.doc.line(n).from),
      );
  }
  return Decoration.set(decos);
}

export const focusDim = [
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = build(view);
      }
      update(u: ViewUpdate) {
        if (u.docChanged || u.selectionSet || u.viewportChanged)
          this.decorations = build(u.view);
      }
    },
    { decorations: (v) => v.decorations },
  ),
];

/** Typewriter mode: the cursor always stays in the middle of the screen. */
export const typewriter = EditorView.updateListener.of((u) => {
  if (!u.selectionSet && !u.docChanged) return;
  const view = u.view;
  requestAnimationFrame(() => {
    view.dispatch({
      effects: EditorView.scrollIntoView(view.state.selection.main.head, {
        y: "center",
      }),
    });
  });
});
