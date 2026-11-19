import { copyLang } from "./i18n/fallback";
import { syncCopy } from "./i18n/sync";
import type { EditorView } from "@codemirror/view";
import {
  Download,
  Eye,
  History,
  Keyboard,
  Minimize,
  Link2,
  Type,
  Library as LibraryIcon,
  Moon,
  PanelRight,
  Sun,
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
import { themeOrder } from "./themes";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Library } from "./Library";
import { Panel, type PanelKind } from "./Panel";
import { Sidebar } from "./Sidebar";
import { Toolbar, type Cmd } from "./Toolbar";
import { isRtlUi, t } from "./i18n";
import { activeBook, titleOf, useStore, wordCount } from "./store";

const Editor = lazy(() => import("./Editor"));
const loadCommands = () => import("./commands");
const loadExport = () => import("./export");

const wide = () => window.matchMedia("(min-width: 861px)").matches;

export function App() {
  const s = useStore();
  const book = useStore(activeBook);
  const { lang, theme, focus, typewriter, fontSize, customBg, customInk } =
    s.settings;
  const view = useRef<EditorView | null>(null);
  const [panel, setPanel] = useState<PanelKind | null>(null);
  const [sidebar, setSidebar] = useState(wide);
  const [menu, setMenu] = useState(false);
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

  const bookWords = book.items
    .filter((i) => !i.trashed)
    .reduce((n, i) => n + wordCount(i.body), 0);
  const nextTheme =
    themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length]!;

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
    else if (cmd === "hr") c.insertHr(v);
  };
  const run = async (k: "md" | "html" | "docx" | "epub" | "pdf") => {
    setMenu(false);
    (await loadExport()).exportBook(book, k).catch(console.error);
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
          {book.title || t(lang, "untitled")}
          <span className="title-chapter"> · {titleOf(item, t(lang, "untitled"))}</span>
        </button>
        <span className="spacer" />
        <button
          className="icon"
          title={`${t(lang, "library")} (⌘⇧L)`}
          aria-label={t(lang, "library")}
          onClick={() => s.openBook(null)}
        >
          <LibraryIcon />
        </button>
        <button
          className="icon"
          aria-pressed={panel === "history"}
          title={t(lang, "history")}
          aria-label={t(lang, "history")}
          onClick={() => setPanel((p) => (p === "history" ? null : "history"))}
        >
          <History />
        </button>
        <div style={{ position: "relative" }}>
          <button
            className="icon"
            title={t(lang, "export")}
            onClick={() => setMenu((m) => !m)}
          >
            <Download />
          </button>
          {menu && (
            <div className="pop">
              <button onClick={() => void run("md")}>{t(lang, "expMd")}</button>
              <button onClick={() => void run("html")}>
                {t(lang, "expHtml")}
              </button>
              <button onClick={() => void run("docx")}>
                {t(lang, "expDocx")}
              </button>
              <button onClick={() => void run("epub")}>
                {t(lang, "expEpub")}
              </button>
              <button onClick={() => void run("pdf")}>
                {t(lang, "expPdf")}
              </button>
            </div>
          )}
        </div>
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
          aria-pressed={tools}
          title={t(lang, "formatting")}
          onClick={toggleTools}
        >
          <Type />
        </button>
        <button
          className="icon"
          title={t(lang, "theme")}
          onClick={() => s.setSettings({ theme: nextTheme })}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </button>
        <button
          className="icon"
          aria-pressed={!!panel}
          title={t(lang, "panelToggle")}
          onClick={() => panelBtn("board")}
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
        {sidebar && !full && (
          <Sidebar
            book={book}
            lang={lang}
            onPick={() => !wide() && setSidebar(false)}
          />
        )}
        <main>
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
