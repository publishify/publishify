import { describe, it, expect } from "vitest";
import { strToU8, zipSync } from "fflate";
import { docxText } from "../import";
describe("Word text import", () => {
  it("keeps paragraphs and heading boundaries", () => {
    const xml =
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Chapter</w:t></w:r></w:p><w:p><w:r><w:t>One &amp; two.</w:t></w:r></w:p></w:body></w:document>';
    expect(docxText(zipSync({ "word/document.xml": strToU8(xml) }))).toBe(
      "# Chapter\n\nOne & two.",
    );
  });
  it("rejects entity declarations", () => {
    const xml = '<!DOCTYPE x [<!ENTITY secret "value">]><x/>';
    expect(() =>
      docxText(zipSync({ "word/document.xml": strToU8(xml) })),
    ).toThrow("invalid_document");
  });
});
