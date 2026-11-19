import { defineLanguageFacet, Language, LanguageSupport } from "@codemirror/language";
import { EditorSelection, Prec, type StateCommand } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { GFM, parser } from "@lezer/markdown";

/**
 * Markdown for the editor, without @codemirror/lang-markdown: that package also bundles the HTML,
 * CSS and JavaScript parsers (for embedded code), which a book never needs.
 */
const language = new Language(
  defineLanguageFacet({ commentTokens: { block: { open: "<!--", close: "-->" } } }),
  parser.configure([GFM]),
  [],
  "markdown",
);

// A list or quote marker at the start of a line: indent, marker, optional task box, then the text.
const MARKER = /^(\s*)(>\s?|[-*+]\s|(\d+)([.)])\s)(\[[ xX]\]\s)?/;

/** The marker the next line should start with, or null when the line has none. */
export function nextMarker(line: string): { prefix: string; empty: boolean } | null {
  const m = MARKER.exec(line);
  if (!m) return null;
  const [all, indent = "", marker = "", num, delim = ".", task] = m;
  const empty = line.slice(all.length).trim() === "";
  const next = num ? `${Number(num) + 1}${delim} ` : marker.startsWith(">") ? "> " : marker;
  return { prefix: indent + next + (task ? "[ ] " : ""), empty };
}

/** Enter: continue a list or quote; on an empty item, end the list instead. */
export const continueMarkup: StateCommand = ({ state, dispatch }) => {
  const sel = state.selection.main;
  if (!sel.empty) return false;
  const line = state.doc.lineAt(sel.head);
  if (sel.head !== line.to) return false;
  const next = nextMarker(line.text);
  if (!next) return false;
  if (next.empty) {
    dispatch(state.update({ changes: { from: line.from, to: line.to, insert: "" }, userEvent: "delete" }));
    return true;
  }
  const insert = state.lineBreak + next.prefix;
  dispatch(
    state.update({
      changes: { from: sel.head, insert },
      selection: EditorSelection.cursor(sel.head + insert.length),
      scrollIntoView: true,
      userEvent: "input",
    }),
  );
  return true;
};

export const markdownSupport = (): LanguageSupport =>
  new LanguageSupport(language, Prec.high(keymap.of([{ key: "Enter", run: continueMarkup }])));

