import { type Range } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate, WidgetType } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { mathHtml, videoEmbed } from "./richText";

/** Pictures, videos and formulas shown in place, away from the cursor; the Markdown comes back on the line you edit. */
class Media extends WidgetType {
  constructor(readonly kind: "img" | "video" | "frame" | "math" | "imath", readonly src: string, readonly alt = "") {
    super();
  }
  eq(o: Media) {
    return o.kind === this.kind && o.src === this.src && o.alt === this.alt;
  }
  toDOM() {
    const box = document.createElement(this.kind === "imath" ? "span" : "div");
    box.className = `cm-media cm-media-${this.kind}`;
    if (this.kind === "img") {
      const img = document.createElement("img");
      img.src = this.src;
      img.alt = this.alt;
      img.loading = "lazy";
      box.append(img);
    } else if (this.kind === "video") {
      const v = document.createElement("video");
      v.src = this.src;
      v.controls = true;
      v.preload = "metadata";
      box.append(v);
    } else if (this.kind === "frame") {
      const f = document.createElement("iframe");
      f.src = this.src;
      f.title = this.alt || "video";
      f.allow = "fullscreen; picture-in-picture";
      f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      box.append(f);
    } else {
      box.textContent = this.src;
      void mathHtml(this.src, this.kind === "math").then((html) => {
        if (html) box.innerHTML = html;
      });
    }
    return box;
  }
  ignoreEvent() {
    return false;
  }
}

const INLINE_MATH = /(?<![\\$])\$(?!\s)([^$\n]+?)(?<!\s)\$(?!\d)/g;

function build(view: EditorView): DecorationSet {
  const { state } = view;
  const active = new Set<number>();
  for (const r of state.selection.ranges)
    for (let n = state.doc.lineAt(r.from).number; n <= state.doc.lineAt(r.to).number; n++) active.add(n);
  const decos: Range<Decoration>[] = [];
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter(node) {
        if (node.name !== "Image") return;
        const line = state.doc.lineAt(node.from);
        if (active.has(line.number)) return false;
        const text = state.sliceDoc(node.from, node.to);
        const m = /^!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)$/.exec(text);
        if (!m) return false;
        const [, alt = "", url = ""] = m;
        const v = videoEmbed(url);
        const w = v ? new Media(v.kind, v.src, alt) : new Media("img", url, alt);
        decos.push(Decoration.replace({ widget: w }).range(node.from, node.to));
        return false;
      },
    });
    for (let n = state.doc.lineAt(from).number; n <= state.doc.lineAt(to).number; n++) {
      if (active.has(n)) continue;
      const line = state.doc.line(n);
      const block = /^\s*\$\$(.+)\$\$\s*$/.exec(line.text);
      if (block) {
        decos.push(Decoration.replace({ widget: new Media("math", block[1]!.trim()) }).range(line.from, line.to));
        continue;
      }
      if (!line.text.includes("$") || line.text.startsWith("    ")) continue;
      for (const m of line.text.matchAll(INLINE_MATH)) {
        const a = line.from + m.index!;
        decos.push(Decoration.replace({ widget: new Media("imath", m[1]!) }).range(a, a + m[0].length));
      }
    }
  }
  return Decoration.set(decos, true);
}

export const mediaPreview = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = build(view);
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.selectionSet || u.viewportChanged) this.decorations = build(u.view);
    }
  },
  { decorations: (v) => v.decorations },
);
