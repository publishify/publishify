import { describe, expect, it } from "vitest";
import { isRtl, langCodes, page, renderMarkdown, slugify } from "../src/render";

describe("g\u00fcvenli Markdown", () => {
  it("ham HTML ve script metne \u00e7evrilir", () => {
    const out = renderMarkdown(
      "merhaba <script>alert(1)</script> d\u00fcnya <img src=x onerror=alert(1)>",
    );
    expect(out).not.toMatch(/<script/i);
    expect(out).not.toMatch(/<img[^>]*onerror/i);
    expect(out).toContain("&lt;script&gt;");
  });
  it("javascript: ve data: ba\u011flant\u0131lar\u0131 kald\u0131r\u0131l\u0131r, https kal\u0131r", () => {
    expect(renderMarkdown("[x](javascript:alert(1))")).not.toMatch(/href/i);
    expect(renderMarkdown("[x](data:text/html,<b>)")).not.toMatch(/href/i);
    expect(renderMarkdown("[x](https://example.com)")).toContain(
      'href="https://example.com"',
    );
    expect(renderMarkdown("[x](https://example.com)")).toContain(
      'rel="nofollow ugc noopener"',
    );
  });
  it("yaln\u0131zca https g\u00f6rsellere izin verilir", () => {
    expect(renderMarkdown("![a](http://e.com/a.png)")).not.toMatch(/<img/);
    expect(renderMarkdown("![a](javascript:1)")).not.toMatch(/<img/);
    expect(renderMarkdown("![a](https://e.com/a.png)")).toMatch(
      /<img src="https:\/\/e.com\/a.png"/,
    );
  });
  it("sat\u0131r sonlar\u0131 korunur (\u015fiir)", () =>
    expect(renderMarkdown("bir\niki")).toContain("<br"));
  it("sayfa \u015fablonunda ba\u015fl\u0131k ve a\u00e7\u0131klama ka\u00e7\u0131r\u0131l\u0131r", () => {
    const h = page({
      title: 'a"<b>',
      description: "<x>",
      canonical: "https://x/k/a",
      lang: "tr",
      body: "",
    });
    expect(h).not.toContain("<b>");
    expect(h).toContain("&lt;b&gt;");
  });
  it("JSON-LD i\u00e7inde '<' ka\u00e7\u0131r\u0131l\u0131r", () => {
    const h = page({
      title: "t",
      description: "d",
      canonical: "https://x",
      lang: "tr",
      body: "",
      jsonLd: { name: "</script><script>alert(1)</script>" },
    });
    expect(h.match(/<script/g)).toHaveLength(1);
  });
});

describe("dil ve y\u00f6n", () => {
  it("sa\u011fdan sola diller", () => {
    for (const l of ["ar", "ota"]) expect(isRtl(l), l).toBe(true);
    for (const l of ["tr", "en", "ku", "zza"]) expect(isRtl(l), l).toBe(false);
  });
  it("RTL sayfa dir=rtl al\u0131r, Osmanl\u0131ca ota-Arab", () => {
    expect(
      page({
        title: "t",
        description: "d",
        canonical: "https://x",
        lang: "ar",
        body: "",
      }),
    ).toContain('dir="rtl"');
    expect(
      page({
        title: "t",
        description: "d",
        canonical: "https://x",
        lang: "ota",
        body: "",
      }),
    ).toContain('lang="ota-Arab"');
  });
  it("yaln\u0131zca se\u00e7ilen diller tan\u0131ml\u0131", () =>
    expect([...langCodes].sort()).toEqual([
      "ar",
      "en",
      "ku",
      "ota",
      "tr",
      "zza",
    ]));
});

describe("slug", () => {
  it("T\u00fcrk\u00e7e karakterler sadele\u015fir", () =>
    expect(
      slugify("\u015eu \u00c7\u0131lg\u0131n T\u00fcrkler: \u0130kinci Kitap!"),
    ).toBe("su-cilgin-turkler-ikinci-kitap"));
  it("bo\u015f ve sembol girdisi bo\u015f d\u00f6ner", () =>
    expect(slugify("!!!")).toBe(""));
});

import { readingMinutes, schemaType, shareLinks } from "../src/render";
describe("payla\u015fma ve yay\u0131n t\u00fcr\u00fc", () => {
  it("payla\u015fma ba\u011flant\u0131lar\u0131 ka\u00e7\u0131r\u0131l\u0131r ve JavaScript i\u00e7ermez", () => {
    const h = shareLinks(
      "https://publishify.app/k/a?x=1&y=<2>",
      'Ba\u015fl\u0131k "x" <b>',
      "tr",
    );
    expect(h).not.toMatch(/<b>/);
    expect(h).not.toMatch(/javascript:/i);
    expect(h).toContain("wa.me");
    expect(h).toContain("Payla\u015f");
    expect(shareLinks("https://x", "t", "ar")).toContain("Share");
  });
  it("schema.org t\u00fcrleri", () => {
    expect(schemaType("roman")).toBe("Book");
    expect(schemaType("blog")).toBe("BlogPosting");
    expect(schemaType("makale")).toBe("ScholarlyArticle");
    expect(schemaType("deneme")).toBe("Article");
  });
  it("okuma s\u00fcresi en az 1 dk", () => {
    expect(readingMinutes("k\u0131sa")).toBe(1);
    expect(readingMinutes(Array(1000).fill("kelime").join(" "))).toBe(5);
  });
});
