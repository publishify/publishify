import { sampleContent } from "./i18n/samples";
import { templateById } from "./templates";
import { NOTE, chapterStart, isNote, useStore } from "./store";
import { guideFor, templateNotes } from "./i18n/guides";
export const samples = sampleContent;
export function openSample(sample: (typeof samples)[number]) {
  const s = useStore.getState();
  const id = s.addBook(sample.template);
  s.patch((state) => ({
    books: state.books.map((book) => {
      if (book.id !== id) return book;
      const guide = {
        id: crypto.randomUUID(),
        kind: "chapter" as const,
        title: "",
        body: sample.body,
        updated: Date.now(),
        versions: [],
        dirty: true,
      };
      const specs = sample.template
        ? templateById(sample.template)?.items
        : undefined;
      const notes = (templateNotes[sample.template ?? ""] ?? templateNotes[`sample:${sample.id}`] ?? []).map(([title, , guide]) => ({
        id: crypto.randomUUID(), kind: "chapter" as const, title: NOTE, body: chapterStart(title, guide),
        updated: Date.now(), versions: [], dirty: true,
      }));
      const chapters = book.items.filter((i) => !isNote(i)).map((item, index) => {
        const spec = specs?.[index];
        return spec
          ? {
              ...item,
              title: spec.k === "part" ? spec.t[0] : "",
              body: spec.k === "chapter" ? chapterStart(spec.t[0], guideFor(spec.t[0])?.[0]) : "",
            }
          : item;
      });
      return {
        ...book,
        title: sample.title,
        author: sample.author,
        lang: "tr" as const,
        items: sample.template ? [guide, ...chapters, ...notes] : [guide, ...notes],
        activeId: guide.id,
      };
    }),
  }));
}
