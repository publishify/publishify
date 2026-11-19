import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
vi.mock("idb-keyval", () => ({ get: vi.fn(), set: vi.fn(async () => {}), del: vi.fn(async () => {}) }));
import { Library } from "../Library";
import { useStore } from "../store";
import { t } from "../i18n";
it("keeps restore available after the last visible book is trashed", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const id = useStore.getState().addBook();
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(createElement(Library, { lang: "en" })));
    const button = (name: string) => [...host.querySelectorAll("button")].find((b) => b.textContent?.trim() === name);
    const openBook = host.querySelector<HTMLButtonElement>(".book-open");
    expect(openBook?.textContent).toContain("Continue");
    await act(async () => useStore.getState().openBook(null));
    await act(async () => openBook!.click());
    expect(useStore.getState().activeBookId).toBe(id);
    await act(async () => button(t("en", "del"))!.click());
    expect(useStore.getState().books.find((b) => b.id === id)?.trashed).toBeTruthy();
    expect(button(t("en", "untrash"))).toBeDefined();
    await act(async () => button(t("en", "untrash"))!.click());
    expect(useStore.getState().books.find((b) => b.id === id)?.trashed).toBeUndefined();
  } finally {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  }
});
