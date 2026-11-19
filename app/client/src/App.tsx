import { copyLang } from "./i18n/fallback";
import { syncCopy } from "./i18n/sync";
import type { EditorView } from "@codemirror/view";
import {
  Bookmark as BookmarkIcon,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Keyboard,
  Maximize,
  Minimize,
  Link2,
  Type,
  Library as LibraryIcon,
  PanelRight,
} from "lucide-react";
import { AccountDialog, AccountIcon } from "./Account";
import { DesktopApprove } from "./DesktopApprove";
import {
  dictationSupported,
  insertDictated,
  startDictation,
} from "./dictation";
import { bookLangOf, langInfo } from "./languages";
import { startSync } from "./sync";
import { startDrive, useDrive } from "./drive";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Library } from "./Library";
import { Panel, type PanelKind } from "./Panel";
import { Sidebar } from "./Sidebar";
import { Toolbar, type Cmd } from "./Toolbar";
import { isRtlUi, t } from "./i18n";
import { activeBook, titleOf, useStore, wordCount, bookItems, isNote, live } from "./store";

const Editor = lazy(() => import("./Editor"));
const loadCommands = () => import("./commands");

/** Shrinks a picture to at most 1600 px wide, as JPEG (PNG keeps transparency), and returns it as a data URL. */
async function shrinkImage(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return file.type === "image/png" ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", 0.82);
}

const wide = () => window.matchMedia("(min-width: 861px)").matches;

export function App() {
  const s = useStore();
  const book = useStore(activeBook);
  const { lang, theme, focus, typewriter, fontSize, customBg, customInk } =
    s.settings;
  const view = useRef<EditorView | null>(null);
  const [panel, setPanel] = useState<PanelKind | null>(null);
  // The page comes first: chapters are pinned only if the writer pinned them (⌘\\); otherwise they slide in from the left edge.
  const [sidebar, setSidebar] = useState(() => {
    try { return localStorage.getItem("pf-sidebar") === "1"; } catch { return false; }
  });
  const [peek, setPeek] = useState(false);
  const [ctx, setCtx] = useState<{ x: number; y: number; pos: number } | null>(null);
  const usedMark = useRef(new Set<string>());
  useEffect(() => {
    try { localStorage.setItem("pf-sidebar", sidebar ? "1" : "0"); } catch { /* private window */ }
  }, [sidebar]);
  useEffect(() => {
    // Typing hides the bar; moving the mouse brings it back. The left edge shows the chapters.
    const move = (e: MouseEvent) => {
      document.documentElement.classList.remove("typing");
      if (e.clientX < 14 && e.clientY > 60) setPeek(true);
    };
    const key = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey && e.key.length === 1 && (e.target as HTMLElement)?.closest?.(".cm-editor"))
        document.documentElement.classList.add("typing");
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("keydown", key); };
  }, []);
  const [full, setFull] = useState(
    () =>
      import.meta.env.DEV &&
      new URLSearchParams(location.search).get("zen") === "1",
  );
  const [nonce, setNonce] = useState(0);
  const [acct, setAcct] = useState(false);
  const [dictating, setDictating] = useState(false);
  const [toast, setToast] = useState("");
  // Writing comes first: the formatting bar is hidden until asked for; selecting text shows a small menu.
  const [tools, setTools] = useState(() => {
    try { return localStorage.getItem("pf-tools") === "1"; } catch { return false; }
  });
  const [bubble, setBubble] = useState<{ x: number; y: number } | null>(null);
  const toggleTools = () =>
    setTools((v) => {
      try { localStorage.setItem("pf-tools", v ? "0" : "1"); } catch { /* private window */ }
      return !v;
    });
  useEffect(() => {
    // ⌘⇧L / Ctrl+Shift+L: back to the library
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        useStore.getState().openBook(null);
      }
      // ⌘\ / Ctrl+\: show or hide the chapters
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setSidebar((v) => !v);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  const stopDictation = useRef<null | (() => void)>(null);
  useEffect(() => () => stopDictation.current?.(), []);
  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(""), 4000);
  };
  const toggleDictation = () => {
    if (dictating) {
      stopDictation.current?.();
      return;
    }
    if (!dictationSupported()) {
      flash(t(s.settings.lang, "dictateUnsupported"));
      return;
    }
    const bl = book ? bookLangOf(book, s.settings.lang) : s.settings.lang;
    const speech = langInfo(bl).speech;
    if (!speech) {
      flash(t(s.settings.lang, "dictateLangUnsupported"));
      return;
    }
    const cmd = bl === "tr" || bl === "en" ? bl : null;
    view.current?.focus();
    setDictating(true);
    stopDictation.current = startDictation(
      speech,
      (text) => {
        if (view.current) insertDictated(view.current, text, cmd, speech);
      },
      (reason) => {
        setDictating(false);
        stopDictation.current = null;
        if (reason === "denied") flash(t(s.settings.lang, "dictateDenied"));
      },
    );
  };
  const tick = useStore((x) => x.remoteTick);
  const drive = useDrive((x) => x.status);

  useEffect(() => {
    void s.init().then(() => {
      startSync();
      startDrive();
    });
  }, []);
  useEffect(() => {
    const r = document.documentElement;
    r.dataset.theme = theme;
    r.lang = lang;
    r.dir = isRtlUi(lang) ? "rtl" : "ltr";
    r.style.setProperty("--doc-size", `${fontSize}px`);
    r.style.setProperty("--c-bg", customBg);
    r.style.setProperty("--c-ink", customInk);
  }, [theme, lang, fontSize, customBg, customInk]);
  useEffect(() => {
    const f = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);

  const item = useMemo(
    () =>
      book?.items.find(
        (i) => i.id === book.activeId && i.kind === "chapter" && !i.trashed,
      ),
    [book],
  );

  if (!s.ready) return <div className="loading">…</div>;
  if (!book || !item) return <Library lang={lang} />;

  const bookWords = bookItems(book).reduce((n, i) => n + wordCount(i.body), 0);
  // Reading order for the arrows: the book's chapters and scenes, or the notes when a note is open.
  const flow = (isNote(item) ? live(book).filter(isNote) : bookItems(book)).filter((i) => i.kind === "chapter");
  const here = flow.findIndex((i) => i.id === item.id);
  const prev = here > 0 ? flow[here - 1] : undefined;
  const next = here >= 0 && here < flow.length - 1 ? flow[here + 1] : undefined;
  // The bookmark is used once per opening of the book.
  let jumpAt: number | undefined;
  if (book.mark?.item === item.id && !usedMark.current.has(book.id)) {
    usedMark.current.add(book.id);
    jumpAt = book.mark.pos;
  }

  /** A picture, video or formula goes on its own line at the cursor. */
  const insertBlock = (v: EditorView, text: string) => {
    const line = v.state.doc.lineAt(v.state.selection.main.head);
    const at = line.to;
    const insert = `${line.length ? "\n\n" : ""}${text}\n\n`;
    v.dispatch({ changes: { from: at, insert }, selection: { anchor: at + insert.length } });
    v.focus();
  };
  /** A picture from this computer, made smaller (at most 1600 pixels wide) and kept inside the chapter. */
  const pickImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      const v = view.current;
      if (!file || !v) return;
      const url = await shrinkImage(file).catch(() => null);
      if (!url || url.length > 1_400_000) {
        setToast(t(lang, "imageTooBig"));
        window.setTimeout(() => setToast(""), 2500);
        return;
      }
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[[\]]/g, "");
      insertBlock(v, `![${alt}](${url})`);
    };
    input.click();
  };

  const onCmd = async (cmd: Cmd) => {
    const c = await loadCommands();
    const v = view.current;
    if (!v) return;
    const wraps: Partial<Record<Cmd, string>> = {
      bold: "**",
      italic: "*",
      strike: "~~",
      code: "`",
    };
    const prefixes: Partial<Record<Cmd, string>> = {
      h1: "# ",
      h2: "## ",
      h3: "### ",
      bullet: "- ",
      numbered: "1. ",
      check: "- [ ] ",
      quote: "> ",
    };
    const w = wraps[cmd];
    const p = prefixes[cmd];
    if (w) c.toggleWrap(v, w);
    else if (p) c.toggleLinePrefix(v, p);
    else if (cmd === "link") c.insertLink(v);
    else if (cmd === "image") pickImage();
    else if (cmd === "video") {
      const url = prompt(t(lang, "videoPrompt"))?.trim();
      if (url) insertBlock(v, `![](${url})`);
    } else if (cmd === "math") {
      const sel = v.state.sliceDoc(v.state.selection.main.from, v.state.selection.main.to);
      if (sel) v.dispatch(v.state.replaceSelection(`$${sel}$`));
      else insertBlock(v, "$$ E = mc^2 $$");
    }
    else if (cmd === "hr") c.insertHr(v);
  };
  const panelBtn = (k: PanelKind) => setPanel((p) => (p ? null : k));

  return (
    <div className={full ? "app zen" : "app"}>
      {acct && <AccountDialog lang={lang} onClose={() => setAcct(false)} />}
      {!acct && <DesktopApprove lang={lang} onSignIn={() => setAcct(true)} />}
      <header className="titlebar" data-tauri-drag-region>
        <button
          className="title"
          title={`${t(lang, "library")} (⌘⇧L)`}
          onClick={() => s.openBook(null)}
        >
          <ChevronLeft className="title-back" aria-hidden="true" />
          {book.title || t(lang, "untitled")}
          <span className="title-chapter"> · {titleOf(item, t(lang, "untitled"))}</span>
        </button>
        <span className="spacer" />
        <button
          className="icon"
          aria-pressed={sidebar}
          title={`${t(lang, "sidebarToggle")} (⌘\\)`}
          aria-label={t(lang, "sidebarToggle")}
          onClick={() => setSidebar((v) => !v)}
        >
          <LibraryIcon />
        </button>
        <button
          className="icon"
          title={t(lang, "account")}
          onClick={() => setAcct(true)}
        >
          <AccountIcon
            status={drive === "syncing" ? "syncing" : s.sync.status}
            signedIn={!!s.account || drive !== "off"}
          />
        </button>
        <button
          className="icon"
          title={t(lang, "fullscreen")}
          aria-label={t(lang, "fullscreen")}
          onClick={() =>
            document.fullscreenElement
              ? void document.exitFullscreen()
              : void document.documentElement.requestFullscreen()
          }
        >
          <Maximize />
        </button>
        <button
          className="icon"
          aria-pressed={tools}
          title={t(lang, "formatting")}
          onClick={toggleTools}
        >
          <Type />
        </button>
        <button
          className="icon"
          aria-pressed={!!panel}
          title={t(lang, "panelToggle")}
          onClick={() => panelBtn("publish")}
        >
          <PanelRight />
        </button>
      </header>

      {tools && <Toolbar
        lang={lang}
        onCmd={(c) => void onCmd(c)}
        dictating={dictating}
        onDictate={toggleDictation}
        right={
          <>
            <button
              className="icon"
              aria-pressed={focus}
              title={t(lang, "focus")}
              onClick={() => s.setSettings({ focus: !focus })}
            >
              <Eye />
            </button>
            <button
              className="icon"
              aria-pressed={typewriter}
              title={t(lang, "typewriter")}
              onClick={() => s.setSettings({ typewriter: !typewriter })}
            >
              <Keyboard />
            </button>
          </>
        }
      />}
      {bubble && !tools && (
        <div
          className="bubble"
          role="toolbar"
          style={{ left: bubble.x, top: bubble.y }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {(["bold", "italic", "h2", "quote", "link"] as const).map((c) => (
            <button key={c} onClick={() => void onCmd(c)} aria-label={t(lang, c === "h2" ? "h2" : c)}>
              {c === "bold" ? <b>B</b> : c === "italic" ? <i>I</i> : c === "h2" ? "H" : c === "quote" ? "“" : <Link2 size={15} />}
            </button>
          ))}
        </div>
      )}

      {book.syncConflict && (
        <div role="alert" className="card">
          {syncCopy[copyLang(lang, syncCopy)].conflict}
          <button
            className="btn"
            onClick={() =>
              s.patch((st) => ({
                books: st.books.map((b) => {
                  if (b.id !== book.id) return b;
                  const conflict = b.syncConflict!;
                  const pos = new Map(
                    (conflict.order ?? []).map((id, n) => [id, n]),
                  );
                  return {
                    ...b,
                    ...conflict.meta,
                    items: conflict.order
                      ? [...b.items].sort(
                          (a, c) =>
                            (pos.get(a.id) ?? 1e9) - (pos.get(c.id) ?? 1e9),
                        )
                      : b.items,
                    metaDirty: !!conflict.meta,
                    orderDirty: !!conflict.order,
                    syncConflict: undefined,
                  };
                }),
              }))
            }
          >
            {syncCopy[copyLang(lang, syncCopy)].keepLocal}
          </button>
          <button
            className="btn"
            onClick={() =>
              s.patch((st) => ({
                books: st.books.map((b) =>
                  b.id === book.id ? { ...b, syncConflict: undefined } : b,
                ),
              }))
            }
          >
            {syncCopy[copyLang(lang, syncCopy)].keepRemote}
          </button>
        </div>
      )}
      <div className="body">
        {(sidebar || peek) && !full && (
          <div className={sidebar ? "sb-wrap" : "sb-wrap peek"} onMouseLeave={() => setPeek(false)}>
            <Sidebar
              book={book}
              lang={lang}
              onPick={() => { setPeek(false); if (!wide()) setSidebar(false); }}
            />
          </div>
        )}
        <main
          onContextMenu={(e) => {
            const v = view.current;
            if (!v || !(e.target as HTMLElement).closest(".cm-content")) return;
            e.preventDefault();
            setCtx({ x: e.clientX, y: e.clientY, pos: v.posAtCoords({ x: e.clientX, y: e.clientY }) ?? v.state.selection.main.head });
          }}
          onClick={() => ctx && setCtx(null)}
        >
          <Suspense fallback={<div className="editor-host" />}>
            <Editor
              docId={`${item.id}:${nonce}:${tick}`}
              value={item.body}
              focus={focus || full}
              typewriter={typewriter || full}
              hint={t(lang, "startWriting")}
              bookLang={bookLangOf(book, lang)}
              onChange={(text) => s.setBody(item.id, text)}
              onSelect={setBubble}
              at={jumpAt}
              onView={(v) => {
                view.current = v;
              }}
            />
          </Suspense>
          {full && (
            <button
              className="zen-exit"
              title={t(lang, "fullscreen")}
              onClick={() => void document.exitFullscreen()}
            >
              <Minimize />
            </button>
          )}
          {toast && (
            <div className="toast" role="status">
              {toast}
            </div>
          )}
          {(prev || next) && (
            <nav className="chapter-nav" aria-label={t(lang, "chapters")}>
              <button className="icon" disabled={!prev} title={t(lang, "prevChapter")} aria-label={t(lang, "prevChapter")} onClick={() => prev && s.setActive(prev.id)}>
                <ChevronLeft />
              </button>
              <button className="icon" disabled={!next} title={t(lang, "nextChapter")} aria-label={t(lang, "nextChapter")} onClick={() => next && s.setActive(next.id)}>
                <ChevronRight />
              </button>
            </nav>
          )}
          {ctx && (
            <div className="ctx-menu" style={{ left: ctx.x, top: ctx.y }} onMouseLeave={() => setCtx(null)}>
              <button
                onClick={() => {
                  s.patch((st) => ({ books: st.books.map((b) => (b.id === book.id ? { ...b, mark: { item: item.id, pos: ctx.pos } } : b)) }));
                  setCtx(null);
                  setToast(t(lang, "bookmarkSet"));
                  window.setTimeout(() => setToast(""), 1800);
                }}
              >
                <BookmarkIcon size={15} /> {t(lang, "bookmarkSet")}
              </button>
              {book.mark && (
                <button
                  onClick={() => {
                    usedMark.current.delete(book.id);
                    s.setActive(book.mark!.item);
                    setNonce((n) => n + 1);
                    setCtx(null);
                  }}
                >
                  <BookmarkCheck size={15} /> {t(lang, "bookmarkGo")}
                </button>
              )}
            </div>
          )}
          <div className="status">
            {wordCount(item.body).toLocaleString(lang)} {t(lang, "words")} ·{" "}
            {s.saveError
              ? t(lang, "saveFailed")
              : s.saving
                ? t(lang, "saving")
                : t(lang, "saved")}
          </div>
        </main>
        {panel && !full && (
          <Panel
            kind={panel}
            setKind={setPanel}
            item={item}
            bookWords={bookWords}
            lang={lang}
            onRestore={() => setNonce((n) => n + 1)}
          />
        )}
      </div>
    </div>
  );
}
