import { copyLang } from "./i18n/fallback";
import { samples, openSample } from "./samples";
import { workspace } from "./i18n/workspace";
import { readImport } from "./import";
import { importCopy } from "./i18n/import";
import {
  BookMarked,
  Compass,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  BookOpen,
  Feather,
  NotebookPen,
  ScrollText,
  Moon,
  Pencil,
  Plus,
  Sun,
} from "lucide-react";
import { useRef, useState } from "react";
import { AccountDialog, AccountIcon } from "./Account";
import { Logo } from "./Logo";
import { BookDialog } from "./BookDialog";
import { useBlobUrl } from "./media";
import { NewBookDialog } from "./NewBookDialog";
import { themeOrder } from "./themes";
import { LibraryTrash } from "./Trash";
import { type Lang, t, uiLangs } from "./i18n";
import { type Book, bookItems, useStore, wordCount } from "./store";
const sampleIcon: Record<string, typeof BookOpen> = { wayfarer: Compass, textbook: GraduationCap, guide: Lightbulb, article: FlaskConical };
const genreIcon = { roman: BookMarked, novella: Feather, hikaye: ScrollText, diger: NotebookPen } as const;

/** Where the writer left off: the last sentence of the chapter edited most recently. */
export function lastLine(book: Book): string {
  const ch = bookItems(book)
    .filter((i) => i.kind === "chapter" && i.body.trim())
    .sort((a, b) => b.updated - a.updated)[0];
  if (!ch) return "";
  const para = ch.body.split("\n").map((l) => l.trim()).filter((l) => l && !/^[#>\-*]/.test(l)).pop() ?? "";
  const s = para.split(/(?<=[.!?…])\s+/).filter(Boolean).pop() ?? "";
  return s.length > 110 ? `…${s.slice(-108)}` : s;
}

function Cover({ book }: { book: Book }) {
  const { url } = useBlobUrl(book.cover);
  const Icon = genreIcon[book.genre ?? "roman"] ?? BookMarked;
  return (
    <div
      className={`cover ${url ? "has-img" : ""}`}
      style={url ? { backgroundImage: `url(${url})` } : undefined}
      role="img"
      aria-label={book.title}
    >
      <strong>{book.title}</strong>
      {!url && <Icon className="cover-icon" aria-hidden="true" />}
      <small>{book.author}</small>
    </div>
  );
}
export function Library({ lang }: { lang: Lang }) {
  const w = workspace(lang);
  const theme = useStore((x) => x.settings.theme);
  const { openBook, trashBook, setSettings } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState(false);
  const copy = importCopy[copyLang(lang, importCopy)];
  const [newBook, setNewBook] = useState(false);
  const books = useStore((x) => x.books).filter((b) => !b.trashed);
  const [edit, setEdit] = useState<string | null>(null);
  const [acct, setAcct] = useState(false);
  const account = useStore((x) => x.account);
  const status = useStore((x) => x.sync.status);
  const words = (b: Book) => bookItems(b).reduce((n, i) => n + wordCount(i.body), 0);
  return (
    <div className="library workspace-library">
      <div className="drag-strip" data-tauri-drag-region />
      {acct && <AccountDialog lang={lang} onClose={() => setAcct(false)} />}
      {edit && (
        <BookDialog bookId={edit} lang={lang} onClose={() => setEdit(null)} />
      )}
      {newBook && (
        <NewBookDialog lang={lang} onClose={() => setNewBook(false)} />
      )}
      <input
        ref={fileInput}
        hidden
        type="file"
        accept=".md,.txt,.docx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setImportError(false);
          void readImport(file)
            .then((data) => {
              const st = useStore.getState();
              const id = st.addBook();
              st.patch((x) => ({
                books: x.books.map((b) => {
                  if (b.id !== id) return b;
                  const items = data.chunks.map((body) => ({
                    id: crypto.randomUUID(),
                    kind: "chapter" as const,
                    title: "",
                    body,
                    updated: Date.now(),
                    versions: [],
                    dirty: true,
                  }));
                  return {
                    ...b,
                    title: data.title,
                    items,
                    activeId: items[0]!.id,
                  };
                }),
              }));
            })
            .catch(() => setImportError(true));
          e.target.value = "";
        }}
      />
      {importError && <p role="alert">{copy.failed}</p>}
      <header className="workspace-header">
        <Logo height={31} />
        <button className="btn" onClick={() => fileInput.current?.click()}>
          {copy.button}
        </button>
        <span className="spacer" />
        <button
          className="icon"
          aria-label={w.theme}
          title={w.theme}
          onClick={() =>
            setSettings({ theme: themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length]! })
          }
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          className="icon"
          title={t(lang, "account")}
          onClick={() => setAcct(true)}
        >
          <AccountIcon status={status} signedIn={!!account} />
        </button>
        <select
          className="field langpick"
          value={lang}
          aria-label={t(lang, "language")}
          onChange={(e) => setSettings({ lang: e.target.value as Lang })}
        >
          {uiLangs.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native}
            </option>
          ))}
        </select>
        <button className="btn primary" onClick={() => setNewBook(true)}>
          <Plus
            size={14}
            style={{ display: "inline", verticalAlign: "-2px" }}
          />{" "}
          {t(lang, "newBook")}
        </button>
      </header>
      {books.length === 0 && (
        <section className="library-empty">
          <h1>{w.yours}</h1>
          <p>{w.local}</p>
        </section>
      )}
      {books.length > 0 && (
        <>
          <div className="section-heading">
            <h1>{w.yours}</h1>
          </div>

          <div className="shelf">
            {books.map((b) => (
              <article key={b.id} className="book">
                <button
                  className="book-open"
                  aria-label={`${w.continue}: ${b.title}`}
                  onClick={() => openBook(b.id)}
                >
                  <Cover book={b} />
                </button>
                <div className="book-info">
                <h3>{b.title || t(lang, "untitled")}</h3>
                {b.author && <p className="book-author">{b.author}</p>}
                {lastLine(b) && <p className="book-last">“{lastLine(b)}”</p>}
                <button className="book-continue" onClick={() => openBook(b.id)}>{w.continue} →</button>
                <div className="meta">
                  <span>
                    {words(b).toLocaleString(lang)} {t(lang, "words")} ·{" "}
                    {bookItems(b).filter((i) => i.kind === "chapter").length}{" "}
                    {t(lang, "chapters")}
                  </span>
                  <span>
                    <button
                      className="link-danger"
                      title={t(lang, "editBook")}
                      aria-label={t(lang, "editBook")}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEdit(b.id);
                      }}
                    >
                      <Pencil
                        size={13}
                        style={{ display: "inline", verticalAlign: "-2px" }}
                      />
                    </button>{" "}
                    <button
                      className="link-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        trashBook(b.id);
                      }}
                    >
                      {t(lang, "del")}
                    </button>
                  </span>
                </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <details className="sample-library" open={books.length === 0}>
        <summary className="section-heading">
          <div>
            <h2>{w.examples}</h2>
            <p>{w.exampleIntro}</p>
          </div>
        </summary>
        <div className="sample-grid">
          {samples.map((sample, index) => (
            <article className={`sample-book sample-${index}`} key={sample.id}>
              <button
                className="sample-open"
                onClick={() => openSample(sample)}
                aria-label={`${w.copy}: ${sample.title}`}
              >
                <span className="sample-cover">
                  <span className="sample-kind">{w.sample}</span>
                  <strong>{sample.title}</strong>
                  <span className="cover-art" aria-hidden="true">
                    {sample.id === "bavul" ? (
                      <span className="suitcase-art" />
                    ) : sample.id === "mercedes" ? (
                      <span className="road-art" />
                    ) : (
                      (() => {
                        const Icon = sampleIcon[sample.id] ?? BookOpen;
                        return <Icon size={48} strokeWidth={1.4} />;
                      })()
                    )}
                  </span>
                  <small>{sample.author}</small>
                </span>
                <span className="sample-cta">
                  {w.copy}
                </span>
              </button>
              <p className="sample-credit">
                {sample.author}
                {sample.source && (
                  <>
                    {" "}
                    ·{" "}
                    <a href={sample.source} target="_blank" rel="noreferrer">
                      {w.source}
                    </a>
                  </>
                )}
              </p>
            </article>
          ))}
        </div>
      </details>
      <LibraryTrash lang={lang} />
    </div>
  );
}
