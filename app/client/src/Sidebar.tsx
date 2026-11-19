import {
  BookOpen,
  Bookmark,
  ScrollText,
  ChevronDown,
  ChevronRight,
  FilePlus2,
  FileText,
  FolderPlus,
  IndentDecrease,
  IndentIncrease,
  Pencil,
  Plus,
  Search,
  StickyNote,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookDialog } from "./BookDialog";
import { NewBookDialog } from "./NewBookDialog";
import { type Lang, t } from "./i18n";
import { ItemTrash } from "./Trash";
import {
  type Book,
  CONFLICT,
  isNote,
  isPlan,
  activeBook,
  hasScenes,
  live,
  titleOf,
  useStore,
  wordCount,
} from "./store";

export function Sidebar({
  book,
  lang,
  onPick,
}: {
  book: Book;
  lang: Lang;
  onPick?: () => void;
}) {
  const {
    setActive,
    addItem,
    renameItem,
    trashItem,
    setLevel,
    moveItem,
    openBook,
  } = useStore();
  const [newBook, setNewBook] = useState(false);
  const books = useStore((s) => s.books).filter((b) => !b.trashed);
  const [edit, setEdit] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!addOpen) return;
    const close = (e: MouseEvent) => {
      if (!addRef.current?.contains(e.target as Node)) setAddOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [addOpen]);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [pick, setPick] = useState(false);
  const cur = useStore(activeBook);

  const rows = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase(lang);
    const items = live(book).filter((i) => !isNote(i));
    let partHidden = false;
    let chapterHidden = false;
    let inPart = false;
    let chapterId = "";
    return items
      .map((i) => {
        if (i.kind === "part") {
          partHidden = closed.has(i.id);
          inPart = true;
          chapterHidden = false;
          return { i, depth: 0, hidden: false, hasKids: false };
        }
        const scene = i.level === 2;
        if (!scene) {
          chapterId = i.id;
          chapterHidden = closed.has(i.id);
        }
        const kids =
          !scene &&
          items.some(
            (x) => x.level === 2 && items.indexOf(x) === items.indexOf(i) + 1,
          );
        const depth = (inPart ? 1 : 0) + (scene ? 1 : 0);
        return {
          i,
          depth,
          hidden: partHidden || (scene && chapterHidden && chapterId !== ""),
          hasKids: kids,
        };
      })
      .filter(({ i, hidden: h }) => {
        if (needle)
          return (
            i.kind === "chapter" &&
            (titleOf(i, "").toLocaleLowerCase(lang).includes(needle) ||
              i.body.toLocaleLowerCase(lang).includes(needle))
          );
        return !h;
      });
  }, [book, closed, q, lang]);

  // Chapters are numbered as in a printed book; conflicted copies wait together at the end.
  const [showCopies, setShowCopies] = useState(false);
  const chapterNo = useMemo(() => {
    const m = new Map<string, number>();
    let n = 0;
    for (const i of live(book)) if (i.kind === "chapter" && i.level !== 2 && i.title !== CONFLICT) m.set(i.id, ++n);
    return m;
  }, [book]);
  const plan = live(book).find(isPlan);
  const notes = live(book).filter((i) => isNote(i) && !isPlan(i) && (!q || i.body.toLocaleLowerCase(lang).includes(q.trim().toLocaleLowerCase(lang))));
  const copies = live(book).filter((i) => i.kind === "chapter" && i.title === CONFLICT).length;

  const toggle = (id: string) =>
    setClosed((c) => {
      const n = new Set(c);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <aside className="sidebar" aria-label={t(lang, "sidebar")}>
      {edit && (
        <BookDialog
          bookId={book.id}
          lang={lang}
          onClose={() => setEdit(false)}
        />
      )}
      {newBook && (
        <NewBookDialog lang={lang} onClose={() => setNewBook(false)} />
      )}
      <div className="sb-head">
        <button className="bookpick" onClick={() => setPick((p) => !p)}>
          <BookOpen /> <span>{cur?.title}</span> <ChevronDown />
        </button>
        <button
          className="icon"
          title={t(lang, "editBook")}
          aria-label={t(lang, "editBook")}
          onClick={() => setEdit(true)}
        >
          <Pencil />
        </button>
      </div>
      {pick && (
        <div className="bookmenu">
          {books.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                openBook(b.id);
                setPick(false);
              }}
            >
              <span style={{ flex: 1 }}>{b.title}</span>
            </button>
          ))}
          <button
            onClick={() => {
              setNewBook(true);
              setPick(false);
            }}
          >
            <Plus size={14} /> {t(lang, "newBook")}
          </button>
        </div>
      )}
      <label className="search">
        <Search />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t(lang, "search")}
        />
        {q && (
          <button
            className="icon"
            style={{ width: 20, height: 20 }}
            onClick={() => setQ("")}
          >
            <X />
          </button>
        )}
      </label>
      <div className="sb-title">
        <span>{t(lang, "contents")}</span>
        <div className="addwrap" ref={addRef}>
          <button
            className="icon"
            style={{ width: 22, height: 22 }}
            title={t(lang, "add")}
            aria-haspopup="menu"
            aria-expanded={addOpen}
            onClick={() => setAddOpen((o) => !o)}
          >
            <Plus />
          </button>
          {addOpen && (
            <div className="addmenu" role="menu">
              <button
                role="menuitem"
                onClick={() => {
                  addItem("part");
                  setAddOpen(false);
                }}
              >
                <FolderPlus /> {t(lang, "addPart")}
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  addItem("chapter");
                  setAddOpen(false);
                }}
              >
                <FilePlus2 /> {t(lang, "addChapter")}
              </button>
              {hasScenes(book) && (
                <button
                  role="menuitem"
                  onClick={() => {
                    addItem("scene");
                    setAddOpen(false);
                  }}
                >
                  <FilePlus2 /> {t(lang, "addScene")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <nav
        className="tree"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          if (drag) moveItem(drag, null);
          setDrag(null);
          setOver(null);
        }}
      >
        {!q && (
          <div
            className={`row chapter plan-row ${plan && plan.id === book.activeId ? "active" : ""}`}
            onClick={() => {
              if (plan) setActive(plan.id);
              else addItem("plan");
              onPick?.();
            }}
          >
            <ScrollText />
            <span className="name">{t(lang, "plan")}</span>
          </div>
        )}
        {rows.length === 0 && q && (
          <p className="muted" style={{ padding: 8 }}>
            {t(lang, "noResults")}
          </p>
        )}
        {rows.filter(({ i }) => showCopies || q || i.title !== CONFLICT).map(({ i, depth, hasKids }) => (
          <div
            key={i.id}
            draggable={!q}
            onDragStart={() => setDrag(i.id)}
            onDragEnd={() => {
              setDrag(null);
              setOver(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOver(i.id);
            }}
            onDrop={(e) => {
              e.stopPropagation();
              if (drag) moveItem(drag, i.id);
              setDrag(null);
              setOver(null);
            }}
            className={`row ${i.kind} ${i.level === 2 ? "scene" : ""} ${!q && depth === 1 ? "in" : ""} ${!q && depth === 2 ? "in2" : ""} ${i.id === book.activeId ? "active" : ""} ${over === i.id && drag !== i.id ? "over" : ""}`}
            onClick={() =>
              i.kind === "chapter"
                ? (setActive(i.id), onPick?.())
                : toggle(i.id)
            }
          >
            {i.kind === "part" || hasKids ? (
              closed.has(i.id) ? (
                <ChevronRight
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(i.id);
                  }}
                />
              ) : (
                <ChevronDown
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(i.id);
                  }}
                />
              )
            ) : (
              <FileText />
            )}
            {i.kind === "chapter" && i.level !== 2 && i.title !== CONFLICT && (
              <span className="num">{chapterNo.get(i.id)}</span>
            )}
            <span className="name">
              {titleOf(
                i,
                i.kind === "part"
                  ? t(lang, "newPart")
                  : i.level === 2
                    ? t(lang, "untitledScene")
                    : t(lang, "untitled"),
              )}
            </span>
            {i.kind === "chapter" && i.title === CONFLICT && (
              <span
                className="badge"
                title={t(lang, "conflictHint")}
                onClick={(e) => {
                  e.stopPropagation();
                  renameItem(i.id, "");
                }}
              >
                {t(lang, "conflictCopy")} ✓
              </span>
            )}
            {book.mark?.item === i.id && <Bookmark className="mark" aria-label={t(lang, "bookmarkGo")} />}
            {i.kind === "chapter" && i.audio && (
              <Volume2 size={13} aria-label={t(lang, "audio")} />
            )}
            {i.kind === "chapter" && <small>{wordCount(i.body)}</small>}
            <span className="acts">
              {i.kind === "chapter" && hasScenes(book) && (
                <button
                  title={t(lang, i.level === 2 ? "toChapter" : "toScene")}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLevel(i.id, i.level !== 2);
                  }}
                >
                  {i.level === 2 ? <IndentDecrease /> : <IndentIncrease />}
                </button>
              )}
              {i.kind === "part" && (
                <button
                  title={t(lang, "rename")}
                  onClick={(e) => {
                    e.stopPropagation();
                    const n = prompt(t(lang, "rename"), i.title);
                    if (n !== null) renameItem(i.id, n);
                  }}
                >
                  <Pencil />
                </button>
              )}
              <button
                title={t(lang, "del")}
                onClick={(e) => {
                  e.stopPropagation();
                  trashItem(i.id);
                }}
              >
                <X />
              </button>
            </span>
          </div>
        ))}
        <div className="notes-head">
          <span>{t(lang, "notes")}</span>
          <button className="icon" title={t(lang, "newNote")} aria-label={t(lang, "newNote")} onClick={() => addItem("note")}>
            <Plus />
          </button>
        </div>
        {notes.map((n) => (
          <div
            key={n.id}
            className={`row chapter note ${n.id === book.activeId ? "active" : ""}`}
            onClick={() => (setActive(n.id), onPick?.())}
          >
            <StickyNote />
            <span className="name">{titleOf(n, t(lang, "untitled"))}</span>
          </div>
        ))}
        {copies > 0 && !q && (
          <button className="copies-row" onClick={() => setShowCopies((v) => !v)} title={t(lang, "conflictHint")}>
            {showCopies ? <ChevronDown /> : <ChevronRight />}
            <span>{t(lang, "conflictCopy")}</span>
            <small>{copies}</small>
          </button>
        )}
      </nav>
      <ItemTrash book={book} lang={lang} />
    </aside>
  );
}
