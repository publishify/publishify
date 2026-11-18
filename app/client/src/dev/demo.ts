// Development only (?demo): loads a sample book for the marketing-site screenshots. Not part of the production build.
// Example: /studio/?demo=1&theme=light&book=tr   (book: tr | ar)
import { useStore } from "../store";
import type { Item } from "../store";

const q = new URLSearchParams(location.search);
const uid = () => crypto.randomUUID();
const ch = (body: string, extra: Partial<Item> = {}): Item => ({
  id: uid(),
  kind: "chapter",
  title: "",
  body,
  updated: Date.now(),
  versions: [],
  ...extra,
});
const part = (title: string): Item => ({
  id: uid(),
  kind: "part",
  title,
  body: "",
  updated: Date.now(),
  versions: [],
});

const tr = () => {
  const open = ch(
    (q.get("zen") ? "" : "# Liman\n\n") +
      "Sabah, sis liman\u0131n \u00fcst\u00fcnden \u00e7ekilmeden \u00f6nce gelmi\u015fti Nehir. Valizi k\u00fc\u00e7\u00fckt\u00fc; i\u00e7inde yaln\u0131zca bir defter, bir kalem ve *annesinin sesinin* kay\u0131tl\u0131 oldu\u011fu eski bir kaset vard\u0131.\n\n> “Deniz, s\u00f6ylemeyi bilmeyenlerin dilidir,” derdi babas\u0131.\n\nNehir bunu hi\u00e7bir zaman anlamam\u0131\u015ft\u0131. Ta ki **o ak\u015fam**, iskelenin ucunda, tuzun kokusu \u00e7ocuklu\u011funun b\u00fct\u00fcn kap\u0131lar\u0131n\u0131 bir anda a\u00e7ana kadar.\n\n- Defterin ilk sayfas\u0131 bo\u015ftu.\n- \u0130kincisine tek bir c\u00fcmle yazd\u0131.\n\nKaset\u00e7alar\u0131 bulmak kolay de\u011fildi; ama yazmak, diye d\u00fc\u015f\u00fcnd\u00fc, hâlâ elindeydi.",
  );
  const items: Item[] = [
    part("I. K\u0131y\u0131"),
    open,
    ch("Sabah, sis \u00e7ekilmeden", { level: 2 }),
    ch("\u0130skelenin ucunda", { level: 2 }),
    ch("# Kaset"),
    ch("Ustan\u0131n d\u00fckkân\u0131", { level: 2 }),
    part("II. A\u00e7\u0131k deniz"),
    ch("# F\u0131rt\u0131na"),
    ch("# D\u00f6n\u00fc\u015f"),
  ];
  return {
    items,
    active: open.id,
    title: "Tuz ve Deniz",
    author: "Yazar Ad\u0131",
    lang: undefined as string | undefined,
  };
};
const ar = () => {
  const open = ch(
    "# الفصل الأول\n\nفي صباحٍ باكر، وصلت نهى إلى الميناء قبل أن ينقشع الضباب. كانت حقيبتها صغيرة، لا يحمل داخلها سوى دفترٍ وقلمٍ وشريطٍ قديمٍ يحفظ صوت أمها.\n\n> «البحر لغة من لا يُجيدون الكلام»، كان أبوها يقول.\n\nلم تفهم نهى ذلك يومًا، حتى **تلك الليلة**، عند طرف الرصيف، حين فتحت رائحة الملح أبواب طفولتها كلها دفعةً واحدة.",
  );
  const items: Item[] = [
    part("القسم الأول"),
    open,
    ch("# الشريط"),
    ch("# العودة"),
  ];
  return {
    items,
    active: open.id,
    title: "الملح والبحر",
    author: "اسم الكاتب",
    lang: "ar",
  };
};

const seed = () => {
  const s = useStore.getState();
  const d = q.get("book") === "ar" ? ar() : tr();
  const id = uid();
  useStore.setState({ ready: true });
  s.patch(() => ({
    books: [
      {
        id,
        title: d.title,
        author: d.author,
        created: Date.now(),
        items: d.items,
        activeId: d.active,
        genre: "roman" as const,
        ...(d.lang ? { lang: d.lang as "ar" } : {}),
      },
    ],
    activeBookId: q.get("library") ? null : id,
    daily: { date: new Date().toISOString().slice(0, 10), words: 312 },
  }));
  s.setSettings({
    theme: (q.get("theme") ?? "light") as "light",
    lang: (q.get("lang") ?? "tr") as "tr",
    focus: q.get("focus") === "1",
    dailyGoal: 500,
  });
};
// IndexedDB can stall in headless Chrome, so seed immediately; in a real browser, seed once more when init finishes.
seed();
window.setTimeout(seed, 2500);
const click = q.get("click");
if (click)
  window.setTimeout(
    () =>
      [...document.querySelectorAll<HTMLElement>("button")]
        .find((b) => (b.textContent ?? "").includes(click) || b.title === click)
        ?.click(),
    3500,
  );
