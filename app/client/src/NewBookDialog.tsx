import { usesTurkishTemplates } from "./i18n";
import { samples, openSample } from "./samples";
import { BookOpen, ArrowUpRight, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { workspace } from "./i18n/workspace";
import { type Lang, t } from "./i18n";
import { type Template, templateGroups, templates } from "./templates";
import { useStore } from "./store";
/** New book: pick an example template by category. */
export function NewBookDialog({
  lang,
  onClose,
}: {
  lang: Lang;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const w = workspace(lang);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => previous?.focus();
  }, []);
  const addBook = useStore((s) => s.addBook);
  const li = usesTurkishTemplates(lang) ? 0 : 1;
  const groups = (Object.keys(templateGroups) as Template["group"][])
    .map((g) => ({ g, list: templates.filter((x) => x.group === g) }))
    .filter((x) => x.list.length);
  const pick = (id: string) => {
    const sample = samples.find((x) => x.template === id);
    if (sample) openSample(sample);
    else addBook(id);
    onClose();
  };
  return (
    <div
      className="modal-back"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialog}
        className="modal wide template-dialog"
        aria-modal="true"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
          if (e.key !== "Tab") return;
          const buttons =
            dialog.current?.querySelectorAll<HTMLButtonElement>("button");
          const first = buttons?.[0],
            last = buttons?.[buttons.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }}
        role="dialog"
        aria-label={t(lang, "newBookTitle")}
      >
        <div className="modal-head">
          <h2>{w.template}</h2>
          <button
            className="icon"
            onClick={onClose}
            aria-label={t(lang, "close")}
          >
            <X />
          </button>
        </div>
        <p className="muted">{w.templateSub}</p>
        <div className="tpl-scroll">
          {groups.map(({ g, list }) => (
            <section key={g}>
              <h3 className="tpl-group">{templateGroups[g][li]}</h3>
              <div className="tpl-grid">
                {list.map((x) => (
                  <button key={x.id} className="tpl" onClick={() => pick(x.id)}>
                    <BookOpen className="tpl-icon" size={24} />
                    <strong>{x.name[li]}</strong>
                    <span>{x.desc[li]}</span>
                    <ArrowUpRight className="tpl-arrow" size={16} />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
