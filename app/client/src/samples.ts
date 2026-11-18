import { sampleContent } from "./i18n/samples";
import { templateById } from "./templates";
import { useStore } from "./store";
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
      const chapters = book.items.map((item, index) => {
        const spec = specs?.[index];
        return spec
          ? {
              ...item,
              title: spec.k === "part" ? spec.t[0] : "",
              body: spec.k === "chapter" ? `# ${spec.t[0]}\n\n` : "",
            }
          : item;
      });
      return {
        ...book,
        title: sample.title,
        author: sample.author,
        lang: "tr" as const,
        items: sample.template ? [guide, ...chapters] : [guide],
        activeId: guide.id,
      };
    }),
  }));
}
