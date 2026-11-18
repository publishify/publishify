import { copyLang } from "./i18n/fallback";
import { Download, ExternalLink } from "lucide-react";
import { useState } from "react";
import { type Lang } from "./i18n";
import { publishingCopy } from "./i18n/publishing";
import { activeBook, useStore } from "./store";

/** Prepare a local manuscript file for the author's chosen publishing channel. */
export function PublishTab({ lang }: { lang: Lang }) {
  const book = useStore(activeBook);
  const copy = publishingCopy[copyLang(lang, publishingCopy)];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  if (!book) return null;
  const formats = [ ["docx", copy.word], ["epub", copy.epub], ["pdf", copy.pdf], ["md", copy.markdown] ] as const;
  const run = async (format: (typeof formats)[number][0]) => {
    setBusy(true); setError(false);
    try { const { exportBook } = await import("./export"); await exportBook(book, format); }
    catch { setError(true); }
    finally { setBusy(false); }
  };
  return <>
    <h3>{copy.title}</h3><p className="muted">{copy.intro}</p>
    <div className="export-formats">{formats.map(([format, label]) => <button className="btn" key={format} disabled={busy} onClick={() => void run(format)}><Download size={16}/>{label}</button>)}</div>
    <p className="muted">{copy.pdfNote}</p>{error && <p role="alert">{copy.error}</p>}
    <h3>{copy.channels}</h3><p className="muted">{copy.channelNote}</p><p className="muted">{copy.note}</p>
    <a className="btn" href={copy.guideUrl} target="_blank" rel="noreferrer">{copy.guide}<ExternalLink size={14}/></a>
  </>;
}
