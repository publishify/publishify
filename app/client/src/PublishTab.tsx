import { copyLang } from "./i18n/fallback";
import { Download, ExternalLink } from "lucide-react";
import { useState } from "react";
import { type Lang, t } from "./i18n";
import { publishingCopy } from "./i18n/publishing";
import { activeBook, isNote, useStore } from "./store";
import type { ExportScope } from "./export";

/** Prepare a local manuscript file for the author's chosen publishing channel. */
export function PublishTab({ lang }: { lang: Lang }) {
  const book = useStore(activeBook);
  const copy = publishingCopy[copyLang(lang, publishingCopy)];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [scope, setScope] = useState<ExportScope>("book");
  if (!book) return null;
  const hasNotes = book.items.some((i) => !i.trashed && isNote(i));
  const formats = [ ["docx", copy.word], ["epub", copy.epub], ["pdf", copy.pdf], ["md", copy.markdown] ] as const;
  const run = async (format: (typeof formats)[number][0]) => {
    setBusy(true); setError(false);
    try { const { exportBook } = await import("./export"); await exportBook(book, format, hasNotes ? scope : "book", t(lang, "notes")); }
    catch { setError(true); }
    finally { setBusy(false); }
  };
  return <>
    <h3>{copy.title}</h3><p className="muted">{copy.intro}</p>
    {hasNotes && (
      <div className="seg" role="radiogroup" aria-label={t(lang, "notes")}>
        {(["book", "with", "notes"] as const).map((k) => (
          <button key={k} role="radio" aria-checked={scope === k} className={scope === k ? "on" : ""} onClick={() => setScope(k)}>
            {t(lang, k === "book" ? "exportBook" : k === "with" ? "exportWithNotes" : "exportNotesOnly")}
          </button>
        ))}
      </div>
    )}
    <div className="export-formats">{formats.map(([format, label]) => <button className="btn" key={format} disabled={busy} onClick={() => void run(format)}><Download size={16}/>{label}</button>)}</div>
    <p className="muted">{copy.pdfNote}</p>{error && <p role="alert">{copy.error}</p>}
    <h3>{copy.channels}</h3><p className="muted">{copy.channelNote}</p><p className="muted">{copy.note}</p>
    <a className="btn" href={copy.guideUrl} target="_blank" rel="noreferrer">{copy.guide}<ExternalLink size={14}/></a>
  </>;
}
