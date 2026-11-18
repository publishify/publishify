import { describe, expect, it } from "vitest";
import { findTurkish } from "../check-language.mjs";

// Turkish sample text is built from escapes so that this file passes the check it tests.
const TR = "\u00e7ak\u0131\u015fan kopya";
const files = (map) => [Object.keys(map), (p) => map[p]];

describe("code language rule", () => {
  it("passes English code", () => {
    expect(findTurkish(...files({ "app/api/src/app.ts": "const title = 'conflict copy';" }))).toEqual([]);
  });

  it("reports the file and line of Turkish text in code", () => {
    const hits = findTurkish(...files({ "app/api/src/app.ts": `const a = 1;\nconst title = "${TR}";` }));
    expect(hits).toEqual(["app/api/src/app.ts:2"]);
  });

  it("catches the dotted capital I and Turkish in comments, SQL and config", () => {
    const hits = findTurkish(
      ...files({
        "app/api/src/a.ts": "// \u0130lk kay\u0131t",
        "app/api/migrations/0001_init.sql": "-- kullan\u0131c\u0131",
        ".github/workflows/ci.yml": "name: denetim \u015femas\u0131",
      }),
    );
    expect(hits).toHaveLength(3);
  });

  it("exempts translations, test fixtures and Markdown", () => {
    const hits = findTurkish(
      ...files({
        "app/client/src/i18n/tr.json": `{"sync.conflictCopy": "${TR}"}`,
        "app/api/test/fixtures/quotes.json": `["${TR}"]`,
        "README.md": TR,
      }),
    );
    expect(hits).toEqual([]);
  });

  it("does not exempt test files outside fixtures", () => {
    const hits = findTurkish(...files({ "board/core/test/quote.test.ts": `it("${TR}", () => {});` }));
    expect(hits).toEqual(["board/core/test/quote.test.ts:1"]);
  });

  it("reports Turkish file names, even in exempt folders", () => {
    const hits = findTurkish(...files({ "board/eval/\u00f6yk\u00fc-01.json": "{}" }));
    expect(hits).toEqual(["board/eval/\u00f6yk\u00fc-01.json: file name"]);
  });
});
