import { describe, expect, it, vi } from "vitest";
vi.mock("idb-keyval", () => ({ get: vi.fn(), set: vi.fn(async () => {}) }));
import { samples, openSample } from "../samples";
import { useStore } from "../store";
import { themeOrder } from "../themes";

describe("sample books", () => {
  it("does not add samples until the author opens a copy", () => {
    expect(samples).toHaveLength(5);
    expect(useStore.getState().books).toHaveLength(0);
  });
  it("opens independent copies without replacing existing manuscripts", () => {
    const existing = useStore.getState().addBook();
    const sample = samples.find((x) => x.id === "mercedes")!;
    openSample(sample);
    const first = useStore.getState().books.find((x) => x.id !== existing)!;
    openSample(sample);
    const state = useStore.getState();
    expect(state.books).toHaveLength(3);
    expect(new Set(state.books.map((x) => x.id)).size).toBe(3);
    expect(state.books.find((x) => x.id === existing)).toBeDefined();
    expect(first.author).toBe(sample.author);
    expect(first.items[0]!.body).toBe(sample.body);
    expect(
      state.books.find((x) => x.id === state.activeBookId)!.items[0]!.id,
    ).not.toBe(first.items[0]!.id);
  });
  it("opens the seven-stage model with its guide and seven editable chapters", () => {
    const sample = samples.find((x) => x.id === "wayfarer")!;
    openSample(sample);
    const state = useStore.getState();
    const book = state.books.find((x) => x.id === state.activeBookId)!;
    expect(book.items).toHaveLength(8);
    expect(book.items[0]!.body).toContain(sample.source);
    expect(book.activeId).toBe(book.items[0]!.id);
    expect(book.lang).toBe("tr");
    expect(book.items.every((x) => x.dirty)).toBe(true);
  });
  it("offers four curated themes and a custom theme", () => {
    expect(themeOrder).toEqual(["light", "dark", "sepia", "pink", "custom"]);
  });
});
