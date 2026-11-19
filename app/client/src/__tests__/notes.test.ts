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
