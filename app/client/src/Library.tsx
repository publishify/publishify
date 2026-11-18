import { copyLang } from "./i18n/fallback";
import { samples, openSample } from "./samples";
import { workspace } from "./i18n/workspace";
import { readImport } from "./import";
import { importCopy } from "./i18n/import";
import {
  ArrowUpRight,
  BookOpen,
  Moon,
  Pencil,
  Plus,
  Sun,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { AccountDialog, AccountIcon } from "./Account";
import { Logo } from "./Logo";
import { BookDialog } from "./BookDialog";
import { useBlobUrl } from "./media";
import { NewBookDialog } from "./NewBookDialog";
import { LibraryTrash } from "./Trash";
import { type Lang, t, uiLangs } from "./i18n";
import { type Book, live, useStore, wordCount } from "./store";
function Cover({ book }: { book: Book }) {
  const { url } = useBlobUrl(book.cover);
  return (
    <div
      className={`cover ${url ? "has-img" : ""}`}
      style={url ? { backgroundImage: `url(${url})` } : undefined}
      role="img"
      aria-label={book.title}
    >
      <strong>{book.title}</strong>
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
  const words = (b: Book) => live(b).reduce((n, i) => n + wordCount(i.body), 0);
  return (
    <div className="library workspace-library">
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
            setSettings({ theme: theme === "dark" ? "light" : "dark" })
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
      <section className="workspace-hero">
        <div className="workspace-welcome">
          <p className="eyebrow">{w.eyebrow}</p>
          <h1>{w.title}</h1>
          <p className="intro">{w.intro}</p>
          <div className="workspace-actions">
            <button className="btn primary" onClick={() => setNewBook(true)}>
              <Plus size={18} />
              {w.create}
            </button>
            <button className="btn" onClick={() => fileInput.current?.click()}>
              <Upload size={17} />
              {w.import}
            </button>
          </div>
          <p className="local-note">{w.local}</p>
        </div>
        <div className="desk-scene" aria-hidden="true">
          <div className="desk-orbit" />
          <div className="desk-paper">
            Write.
            <br />
            Refine.
            <br />
            <em>Publish.</em>
          </div>
          <div className="desk-volume">
            <img src="/demo-cover.svg" alt="" />
          </div>
          <span className="desk-caption">{w.cover}</span>
        </div>
      </section>
      {books.length > 0 && (
        <>
          <div className="section-heading">
            <h2>{w.yours}</h2>
            <span>{books.length.toLocaleString(lang)}</span>
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
                <div className="meta">
                  <span>
                    {words(b).toLocaleString(lang)} {t(lang, "words")} ·{" "}
                    {live(b).filter((i) => i.kind === "chapter").length}{" "}
                    {t(lang, "chapters")}
                  </span>
                  <span>
                    <button
                      className="link-danger"
                      title={t(lang, "editBook")}
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
              </article>
            ))}
          </div>
        </>
      )}
      <section className="sample-library">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PUBLISHIFY</p>
            <h2>{w.examples}</h2>
            <p>{w.exampleIntro}</p>
          </div>
        </div>
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
                    {index === 0 ? (
                      <BookOpen size={52} />
                    ) : index === 1 ? (
                      <span className="suitcase-art" />
                    ) : index === 2 ? (
                      <span className="road-art" />
                    ) : (
                      <BookOpen size={48} />
                    )}
                  </span>
                  <small>{sample.author}</small>
                </span>
                <span className="sample-cta">
                  {w.copy}
                  <ArrowUpRight size={17} />
                </span>
              </button>
              <p className="sample-credit">
                {sample.id === "liman" ? w.demo : sample.author}
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
      </section>
      <LibraryTrash lang={lang} />
    </div>
  );
}
