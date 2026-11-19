// After a new release, an open page may ask for a code chunk that no longer exists.
// Reload to pick up the new release instead of showing an empty page; at most once a minute,
// so a chunk that is really missing cannot cause a reload loop.
window.addEventListener("vite:preloadError", (event) => {
  const key = "publishify:reloaded-for-release";
  try {
    if (Date.now() - Number(sessionStorage.getItem(key) ?? 0) < 60_000) return;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    return;
  }
  event.preventDefault();
  location.reload();
});
if (import.meta.env.DEV && location.search.includes("demo"))
  await import("./dev/demo");
// In development, ?mockdrive loads a fake Drive (src/dev/mock-drive.ts).
if (import.meta.env.DEV && location.search.includes("mockdrive"))
  await import("./dev/mock-drive");
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { loadLang } from "./i18n";
import { useStore } from "./store";
import "./styles.css";
import "./workspace.css";

// Fetch the interface language before the first paint, and again whenever it changes.
await loadLang(useStore.getState().settings.lang).catch(() => undefined);
useStore.subscribe((now, before) => {
  if (now.settings.lang !== before.settings.lang)
    void loadLang(now.settings.lang).then(() => useStore.setState({}));
});

// The desktop app on macOS draws its content under the window buttons (overlay title bar).
if ("__TAURI__" in window && /Mac/.test(navigator.userAgent))
  document.documentElement.classList.add("mac-desktop");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
