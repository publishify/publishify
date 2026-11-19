import { describe, expect, it } from "vitest";
import { scoped } from "../export";
import { NOTE, bookItems, type Book } from "../store";

const book: Book = {
  id: "b", title: "T", author: "", created: 0, activeId: "c1",
  items: [
    { id: "c1", kind: "chapter", title: "", body: "# One\n\nText", updated: 0, versions: [] },
    { id: "n1", kind: "chapter", title: NOTE, body: "# Mara\n\nGreen eyes", updated: 0, versions: [] },
  ],
};

describe("notes", () => {
  it("are not part of the book's own text", () => {
    expect(bookItems(book).map((i) => i.id)).toEqual(["c1"]);
  });
  it("export as book only, book with notes, or notes only", () => {
    expect(scoped(book, "book").items.map((i) => i.id)).toEqual(["c1"]);
    expect(scoped(book, "with", "Notes").items.map((i) => i.id)).toEqual(["c1", "notes", "n1"]);
    expect(scoped(book, "notes").items.map((i) => i.id)).toEqual(["n1"]);
  });
});

describe("template guides", () => {
  it("are left out of word counts and exports", async () => {
    const { wordCount } = await import("../store");
    const { toMarkdown } = await import("../export");
    const body = "# Call\n\n<!-- A guide of many words here -->\n\nOne two";
    expect(wordCount(body)).toBe(4);
    const b: Book = { ...book, items: [{ ...book.items[0]!, body }] };
    expect(toMarkdown(b)).not.toContain("guide");
  });
});
