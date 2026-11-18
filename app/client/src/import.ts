import { unzipSync, strFromU8 } from "fflate";
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_XML = 5 * 1024 * 1024;
export function docxText(bytes: Uint8Array): string {
  const files = unzipSync(bytes, {
    filter: (f) => f.name === "word/document.xml" && f.originalSize <= MAX_XML,
  });
  const raw = files["word/document.xml"];
  if (!raw || raw.length > MAX_XML) throw Error("document_limit");
  const xml = strFromU8(raw);
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw Error("invalid_document");
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) throw Error("invalid_document");
  const ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const local = (e: Element) =>
    (e.localName || e.tagName).split(":").pop()!.toLowerCase();
  const all = (e: Document | Element) =>
    Array.from(e.getElementsByTagName("*"));
  return all(doc)
    .filter((e) => local(e) === "p")
    .map((p) => {
      const children = all(p);
      const text = children
        .filter((e) => ["t", "tab", "br"].includes(local(e)))
        .map((e) =>
          local(e) === "tab"
            ? "\t"
            : local(e) === "br"
              ? "\n"
              : (e.textContent ?? ""),
        )
        .join("");
      const tag = children.find((e) => local(e) === "pstyle");
      const style =
        tag?.getAttributeNS(ns, "val") ?? tag?.getAttribute("w:val") ?? "";
      return /^Heading[1-6]$/i.test(style) ? `# ${text}` : text;
    })
    .join("\n\n");
}
export async function readImport(file: File) {
  if (file.size > MAX_BYTES) throw Error("file_limit");
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["md", "txt", "docx"].includes(ext ?? ""))
    throw Error("unsupported_format");
  const text =
    ext === "docx"
      ? docxText(new Uint8Array(await file.arrayBuffer()))
      : await file.text();
  if (!text.trim()) throw Error("empty_document");
  const chunks = text
    .replace(/\r\n?/g, "\n")
    .split(/(?=^#{1,2}\s+\S)/m)
    .filter((x) => x.trim());
  return { title: file.name.replace(/\.[^.]+$/, ""), chunks };
}
