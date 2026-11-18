import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { DatabaseSync } from "node:sqlite";
import { webcrypto } from "node:crypto";
import vm from "node:vm";
import { describe, it, expect } from "vitest";
function createBook() {
  const db = new DatabaseSync(":memory:");
  const sql = {
    exec(query, ...args) {
      if (query.includes("CREATE TABLE")) {
        db.exec(query);
        return { toArray: () => [] };
      }
      const rows = db.prepare(query).all(...args);
      return { toArray: () => rows };
    },
  };
  const ctx = {
    storage: {
      sql,
      transactionSync(fn) {
        db.exec("BEGIN");
        try {
          const value = fn();
          db.exec("COMMIT");
          return value;
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
      },
    },
    blockConcurrencyWhile(fn) {
      fn();
    },
  };
  const source = stripTypeScriptTypes(
    readFileSync(
      new URL("../../app/api/src/book-do.ts", import.meta.url),
      "utf8",
    ),
  )
    .replace(/^import .*;$/gm, "")
    .replace("export class BookDO", "class BookDO");
  const context = {
    crypto: webcrypto,
    DurableObject: class {
      constructor(ctx) {
        this.ctx = ctx;
      }
    },
  };
  vm.runInNewContext(source + "\nthis.Book=BookDO;", context);
  return new context.Book(ctx, {});
}
const item = (body, baseSeq = 0) => ({
  id: "a",
  kind: "chapter",
  title: "",
  body,
  baseSeq,
});
describe("book data integrity", () => {
  it("preserves both texts when a stale device submits an edit", () => {
    const book = createBook();
    const first = book.sync({ cursor: 0, items: [item("initial")] });
    const next = book.sync({
      cursor: first.cursor,
      items: [item("device A", first.accepted.a)],
    });
    const conflict = book.sync({
      cursor: first.cursor,
      items: [item("device B", first.accepted.a)],
    });
    expect(conflict.conflicts).toHaveLength(1);
    expect(conflict.items.map((i) => i.body).sort()).toEqual([
      "device A",
      "device B",
    ]);
    expect(next.conflicts).toHaveLength(0);
  });
  it("preserves the newer book title and order against stale metadata", () => {
    const book = createBook();
    const first = book.sync({
      cursor: 0,
      items: [item("text")],
      meta: { title: "Initial", author: "A" },
      order: ["a"],
    });
    book.sync({
      cursor: first.cursor,
      items: [],
      meta: { title: "New", author: "A" },
      order: ["b", "a"],
    });
    const stale = book.sync({
      cursor: first.cursor,
      items: [],
      meta: { title: "Old", author: "A" },
      order: ["a"],
    });
    expect(stale.metadataConflicts.sort()).toEqual(["meta", "order"]);
    expect(stale.meta.title).toBe("New");
    expect(stale.order).toEqual(["b", "a"]);
  });
  it("retains the previous text in server history", () => {
    const book = createBook();
    const first = book.sync({ cursor: 0, items: [item("before")] });
    book.sync({
      cursor: first.cursor,
      items: [item("after", first.accepted.a)],
    });
    expect(book.history("a")[0].body).toBe("before");
  });
});
