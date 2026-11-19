/** Formulas (KaTeX, loaded only when a book has one) and video links, shared by the editor and exports. */

let katex: Promise<typeof import("katex")["default"]> | null = null;
const loadKatex = () => (katex ??= import("katex").then(async (m) => {
  await import("katex/dist/katex.min.css");
  return m.default;
}));

/** A formula as HTML (with MathML for screen readers and e-readers), or null if it cannot be read. */
export async function mathHtml(tex: string, display: boolean, mathml = false): Promise<string | null> {
  try {
    const k = await loadKatex();
    return k.renderToString(tex, { displayMode: display, throwOnError: false, output: mathml ? "mathml" : "htmlAndMathml" });
  } catch {
    return null;
  }
}

/** A video link as something a page can play: a file for <video>, or an embed address for YouTube and Vimeo. */
export function videoEmbed(url: string): { kind: "video" | "frame"; src: string } | null {
  if (/^(https?:|blob:|data:video\/)/i.test(url) && /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(url)) return { kind: "video", src: url };
  const yt = /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i.exec(url);
  if (yt) return { kind: "frame", src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vm = /^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i.exec(url);
  if (vm) return { kind: "frame", src: `https://player.vimeo.com/video/${vm[1]}` };
  return null;
}

const INLINE = /(?<![\\$])\$(?!\s)([^$\n]+?)(?<!\s)\$(?!\d)/g;

/**
 * Prepares Markdown for HTML, PDF and EPUB exports: formulas become placeholders (filled after the
 * Markdown is rendered, so the formula HTML is never re-read as Markdown) and video files become players.
 */
export async function richMarkdown(md: string): Promise<{ md: string; fill: (html: string) => string }> {
  const parts: string[] = [];
  const hold = (html: string | null, raw: string) => `@@PFMATH${parts.push(html ?? raw) - 1}@@`;
  let out = md;
  if (md.includes("$")) {
    for (const m of [...out.matchAll(/\$\$([\s\S]+?)\$\$/g)])
      out = out.replace(m[0], hold(await mathHtml(m[1]!.trim(), true, true), m[0]));
    for (const m of [...out.matchAll(INLINE)]) out = out.replace(m[0], hold(await mathHtml(m[1]!, false, true), m[0]));
  }
  out = out.replace(/!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?\s*\)/g, (raw, alt: string, url: string) => {
    const v = videoEmbed(url);
    if (!v) return raw;
    if (v.kind === "video") return `<video controls src="${url.replace(/"/g, "%22")}"></video>`;
    return `[${alt || url}](${url})`; // e-books and print cannot play embedded players: keep a link
  });
  return { md: out, fill: (html) => html.replace(/@@PFMATH(\d+)@@/g, (_, n: string) => parts[Number(n)] ?? "") };
}
