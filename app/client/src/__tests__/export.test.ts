import { describe, expect, it } from "vitest";
import { toMarkdown } from "../export";
import type { Book, Item } from "../store";

const item = (o: Partial<Item> & { body: string }): Item => ({
  id: crypto.randomUUID(),
  kind: "chapter",
  title: "",
  updated: 0,
  versions: [],
  ...o,
});
const mk = (items: Item[]): Book => ({
  id: "b",
  title: "Kitap",
  author: "Yazar",
  created: 0,
  items,
  activeId: items[0]!.id,
});

describe("markdown export", () => {
  it("part title, chapter and scenes in order", () => {
    const md = toMarkdown(
      mk([
        item({ kind: "part", title: "Birinci K\u0131s\u0131m", body: "" }),
        item({ body: "# Bir\n\nGiri\u015f." }),
        item({ body: "Sahne bir.", level: 2 }),
        item({ body: "Sahne iki.", level: 2 }),
      ]),
    );
    expect(md).toContain("# Birinci K\u0131s\u0131m");
    expect(md).toContain(
      "# Bir\n\nGiri\u015f.\n\n* * *\n\nSahne bir.\n\n* * *\n\nSahne iki.",
    );
  });
  it("if the chapter is only a heading, no separator is placed before the first scene", () => {
    const md = toMarkdown(
      mk([
        item({ body: "# Bir" }),
        item({ body: "A.", level: 2 }),
        item({ body: "B.", level: 2 }),
      ]),
    );
    expect(md).toContain("# Bir\n\nA.\n\n* * *\n\nB.");
  });
  it("trashed chapters are not exported", () => {
    const md = toMarkdown(
      mk([
        item({ body: "# Kal\u0131r" }),
        item({ body: "# Gider", trashed: 1 }),
      ]),
    );
    expect(md).toContain("Kal\u0131r");
    expect(md).not.toContain("Gider");
  });
});
