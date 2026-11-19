// \u00d6rnek \u015fablonlar: yeni kitap i\u00e7in kategoriye g\u00f6re haz\u0131r iskelet (k\u0131s\u0131m/b\u00f6l\u00fcm/sahne ba\u015fl\u0131klar\u0131).
// \u015eablonlar metne \u00f6\u011f\u00fct yazmaz; yaln\u0131zca yap\u0131y\u0131 kurar. Yazar ba\u015fl\u0131klar\u0131 de\u011fi\u015ftirir, siler, \u00e7o\u011falt\u0131r.
import type { Genre } from "./store";

type Spec = { k: "part" | "chapter" | "scene"; t: [string, string] };
export interface Template {
  id: string;
  group: "kurgu" | "siir" | "dusunce" | "akademik" | "diger";
  genre: Genre;
  name: [string, string];
  desc: [string, string];
  items: Spec[];
}

const P = (tr: string, en: string): Spec => ({ k: "part", t: [tr, en] });
const C = (tr: string, en: string): Spec => ({ k: "chapter", t: [tr, en] });
const S = (): Spec => ({ k: "scene", t: ["", ""] });

export const templateGroups: Record<Template["group"], [string, string]> = {
  kurgu: ["Kurgu", "Fiction"],
  siir: ["\u015eiir", "Poetry"],
  dusunce: ["Deneme ve kurgu d\u0131\u015f\u0131", "Essay and non-fiction"],
  akademik: ["Akademik", "Academic"],
  diger: ["Di\u011fer", "Other"],
};

export const templates: Template[] = [
  {
    id: "bos",
    group: "diger",
    genre: "roman",
    name: ["Bo\u015f kitap", "Blank book"],
    desc: [
      "Tek bir bo\u015f b\u00f6l\u00fcmle ba\u015fla.",
      "Start with one empty chapter.",
    ],
    items: [C("Birinci b\u00f6l\u00fcm", "Chapter one")],
  },

  {
    id: "roman-yedi-merhale",
    group: "kurgu",
    genre: "roman",
    name: ["Yolcunun Yedi Merhalesi (Kahraman\u0131n Yolculu\u011fu \u015eablonu)", "The Wayfarer's Seven Stages (Hero's Journey template)"],
    desc: [
      "Ali Osman Ak\u00e7ao\u011flu\u2019nun anlat\u0131y\u0131 dert \u00fczerinden okuyan yedi merhaleli modeli.",
      "Ali Osman Akcaoglu's seven-stage narrative model centred on inner need.",
    ],
    items: [
      C("\u00c7a\u011fr\u0131", "Call"),
      C("K\u0131lavuz", "Guide"),
      C("E\u015fik", "Threshold"),
      C("S\u0131nav", "Trial"),
      C("Uyan\u0131\u015f", "Awakening"),
      C("\u00d6d\u00fcl", "Reward"),
      C("D\u00f6n\u00fc\u015f", "Return"),
    ],
  },
  {
    id: "roman-uc-perde",
    group: "kurgu",
    genre: "roman",
    name: ["Roman — \u00fc\u00e7 perde", "Novel — three acts"],
    desc: [
      "Kurulum, \u00e7at\u0131\u015fma, \u00e7\u00f6z\u00fcm. \u00dc\u00e7 k\u0131s\u0131m, sekiz b\u00f6l\u00fcm, sahneler.",
      "Setup, confrontation, resolution. Three parts, eight chapters, scenes.",
    ],
    items: [
      P("I. Kurulum", "I. Setup"),
      C("Ola\u011fan d\u00fcnya", "The ordinary world"),
      S(),
      S(),
      C("Tetikleyici olay", "Inciting incident"),
      S(),
      P("II. \u00c7at\u0131\u015fma", "II. Confrontation"),
      C("Artan engeller", "Rising obstacles"),
      S(),
      S(),
      C("Orta nokta", "Midpoint"),
      S(),
      C("Kriz", "Crisis"),
      S(),
      P("III. \u00c7\u00f6z\u00fcm", "III. Resolution"),
      C("Doruk", "Climax"),
      S(),
      S(),
      C("Sonu\u00e7", "Resolution"),
      S(),
    ],
  },
  {
    id: "novella",
    group: "kurgu",
    genre: "novella",
    name: ["Novella", "Novella"],
    desc: [
      "K\u0131sa ve yo\u011fun anlat\u0131: alt\u0131 b\u00f6l\u00fcm, her birinde bir sahne.",
      "Short, dense narrative: six chapters with one scene each.",
    ],
    items: [
      C("A\u00e7\u0131l\u0131\u015f", "Opening"),
      S(),
      C("Y\u00fckseli\u015f", "Rising"),
      S(),
      C("D\u00f6n\u00fcm noktas\u0131", "Turning point"),
      S(),
      C("\u00c7at\u0131\u015fma", "Conflict"),
      S(),
      C("Doruk", "Climax"),
      S(),
      C("Kapan\u0131\u015f", "Closing"),
      S(),
    ],
  },
  {
    id: "hikaye",
    group: "kurgu",
    genre: "hikaye",
    name: ["Hikâye (\u00f6yk\u00fc)", "Short story"],
    desc: [
      "Tek b\u00f6l\u00fcm, \u00fc\u00e7 sahne: a\u00e7\u0131l\u0131\u015f, geli\u015fme, son.",
      "One chapter, three scenes: opening, development, ending.",
    ],
    items: [C("Ba\u015fl\u0131k", "Title"), S(), S(), S()],
  },
  {
    id: "kucurek",
    group: "kurgu",
    genre: "hikaye",
    name: ["K\u00fc\u00e7\u00fcrek \u00f6yk\u00fc", "Flash fiction"],
    desc: ["Tek sayfal\u0131k bo\u015f bir metin.", "A single empty page."],
    items: [C("Ba\u015fl\u0131k", "Title")],
  },

  {
    id: "siir",
    group: "siir",
    genre: "diger",
    name: ["\u015eiir kitab\u0131", "Poetry collection"],
    desc: [
      "\u00dc\u00e7 k\u0131s\u0131m, her birinde \u00fc\u00e7 \u015fiir.",
      "Three parts, three poems each.",
    ],
    items: [
      P("I", "I"),
      C("\u015eiir", "Poem"),
      C("\u015eiir", "Poem"),
      C("\u015eiir", "Poem"),
      P("II", "II"),
      C("\u015eiir", "Poem"),
      C("\u015eiir", "Poem"),
      C("\u015eiir", "Poem"),
      P("III", "III"),
      C("\u015eiir", "Poem"),
      C("\u015eiir", "Poem"),
      C("\u015eiir", "Poem"),
    ],
  },

  {
    id: "deneme",
    group: "dusunce",
    genre: "diger",
    name: ["Edebi deneme", "Literary essay"],
    desc: [
      "Tek deneme: a\u00e7\u0131l\u0131\u015f, d\u00fc\u015f\u00fcnce, kar\u015f\u0131 g\u00f6r\u00fc\u015f, kapan\u0131\u015f.",
      "A single essay: opening, thought, counterargument, closing.",
    ],
    items: [
      C("A\u00e7\u0131l\u0131\u015f", "Opening"),
      C("D\u00fc\u015f\u00fcnce", "Thought"),
      C("Kar\u015f\u0131 g\u00f6r\u00fc\u015f", "Counterargument"),
      C("Kapan\u0131\u015f", "Closing"),
    ],
  },
  {
    id: "blog",
    group: "dusunce",
    genre: "diger",
    name: ["Blog yaz\u0131s\u0131", "Blog post"],
    desc: [
      "Tek sayfal\u0131k, do\u011frudan yay\u0131nlanabilir yaz\u0131.",
      "A single page you can publish right away.",
    ],
    items: [C("Ba\u015fl\u0131k", "Title")],
  },
  {
    id: "deneme-kitabi",
    group: "dusunce",
    genre: "diger",
    name: ["Deneme kitab\u0131", "Essay collection"],
    desc: ["\u00d6ns\u00f6z ve alt\u0131 deneme.", "A preface and six essays."],
    items: [
      C("\u00d6ns\u00f6z", "Preface"),
      C("Birinci deneme", "First essay"),
      C("\u0130kinci deneme", "Second essay"),
      C("\u00dc\u00e7\u00fcnc\u00fc deneme", "Third essay"),
      C("D\u00f6rd\u00fcnc\u00fc deneme", "Fourth essay"),
      C("Be\u015finci deneme", "Fifth essay"),
      C("Alt\u0131nc\u0131 deneme", "Sixth essay"),
    ],
  },
  {
    id: "ani",
    group: "dusunce",
    genre: "diger",
    name: ["An\u0131 / biyografi", "Memoir / biography"],
    desc: [
      "Ya\u015fam d\u00f6nemlerine g\u00f6re: \u00e7ocukluk, gen\u00e7lik, d\u00f6n\u00fcm noktalar\u0131, bug\u00fcn.",
      "By life period: childhood, youth, turning points, today.",
    ],
    items: [
      C("\u00d6ns\u00f6z", "Preface"),
      P("\u00c7ocukluk", "Childhood"),
      C("\u0130lk an\u0131lar", "First memories"),
      P("Gen\u00e7lik", "Youth"),
      C("Yollar", "Roads"),
      P("D\u00f6n\u00fcm noktalar\u0131", "Turning points"),
      C("Karar an\u0131", "The decision"),
      P("Bug\u00fcn", "Today"),
      C("Geriye bak\u0131nca", "Looking back"),
    ],
  },
  {
    id: "rehber",
    group: "dusunce",
    genre: "diger",
    name: ["Kurgu d\u0131\u015f\u0131 rehber", "Non-fiction guide"],
    desc: [
      "Giri\u015f, sorun, y\u00f6ntem, uygulama, sonu\u00e7.",
      "Introduction, problem, method, practice, conclusion.",
    ],
    items: [
      C("Giri\u015f", "Introduction"),
      C("Sorun", "The problem"),
      C("Y\u00f6ntem", "The method"),
      C("Uygulama", "In practice"),
      C("Sonu\u00e7", "Conclusion"),
    ],
  },

  {
    id: "ders-kitabi",
    group: "akademik",
    genre: "diger",
    name: ["Ders kitab\u0131", "Textbook"],
    desc: [
      "\u00d6ns\u00f6z, kullan\u0131m k\u0131lavuzu, iki \u00fcnite (kazan\u0131mlar, konu, etkinlik, de\u011ferlendirme), s\u00f6zl\u00fck ve cevap anahtar\u0131.",
      "Preface, how to use, two units (outcomes, topic, activities, assessment), glossary and answer key.",
    ],
    items: [
      C("\u00d6ns\u00f6z", "Preface"),
      C("Bu kitap nas\u0131l kullan\u0131l\u0131r", "How to use this book"),
      P("1. \u00dcnite", "Unit 1"),
      C("Kazan\u0131mlar", "Learning outcomes"),
      C("Konu anlat\u0131m\u0131", "The topic"),
      C("\u00d6rnekler ve etkinlikler", "Examples and activities"),
      C("De\u011ferlendirme", "Assessment"),
      P("2. \u00dcnite", "Unit 2"),
      C("Kazan\u0131mlar", "Learning outcomes"),
      C("Konu anlat\u0131m\u0131", "The topic"),
      C("\u00d6rnekler ve etkinlikler", "Examples and activities"),
      C("De\u011ferlendirme", "Assessment"),
      C("S\u00f6zl\u00fck", "Glossary"),
      C("Cevap anahtar\u0131", "Answer key"),
    ],
  },
  {
    id: "makale",
    group: "akademik",
    genre: "diger",
    name: ["Akademik makale", "Academic article"],
    desc: [
      "\u00d6zet, giri\u015f, kuramsal \u00e7er\u00e7eve, y\u00f6ntem, bulgular, tart\u0131\u015fma, sonu\u00e7, kaynak\u00e7a.",
      "Abstract, introduction, framework, method, findings, discussion, conclusion, references.",
    ],
    items: [
      C("\u00d6zet", "Abstract"),
      C("Giri\u015f", "Introduction"),
      C("Kuramsal \u00e7er\u00e7eve", "Theoretical framework"),
      C("Y\u00f6ntem", "Method"),
      C("Bulgular", "Findings"),
      C("Tart\u0131\u015fma", "Discussion"),
      C("Sonu\u00e7", "Conclusion"),
      C("Kaynak\u00e7a", "References"),
    ],
  },
  {
    id: "tez",
    group: "akademik",
    genre: "diger",
    name: ["Akademik kitap / tez", "Academic book / thesis"],
    desc: [
      "\u00d6ns\u00f6z, giri\u015f, d\u00f6rt ana b\u00f6l\u00fcm, sonu\u00e7, kaynak\u00e7a, ekler.",
      "Preface, introduction, four main chapters, conclusion, references, appendices.",
    ],
    items: [
      C("\u00d6ns\u00f6z", "Preface"),
      C("Giri\u015f", "Introduction"),
      C("Birinci b\u00f6l\u00fcm", "Chapter one"),
      C("\u0130kinci b\u00f6l\u00fcm", "Chapter two"),
      C("\u00dc\u00e7\u00fcnc\u00fc b\u00f6l\u00fcm", "Chapter three"),
      C("D\u00f6rd\u00fcnc\u00fc b\u00f6l\u00fcm", "Chapter four"),
      C("Sonu\u00e7", "Conclusion"),
      C("Kaynak\u00e7a", "References"),
      C("Ekler", "Appendices"),
    ],
  },

  {
    id: "cocuk",
    group: "diger",
    genre: "diger",
    name: ["\u00c7ocuk resimli kitab\u0131", "Children's picture book"],
    desc: ["On iki sayfa (a\u00e7\u0131l\u0131m).", "Twelve spreads."],
    items: Array.from({ length: 12 }, (_, i) =>
      C(`Sayfa ${i + 1}`, `Page ${i + 1}`),
    ),
  },
  {
    id: "oyun",
    group: "diger",
    genre: "diger",
    name: ["Oyun / senaryo", "Play / screenplay"],
    desc: [
      "\u00dc\u00e7 perde, her birinde \u00fc\u00e7 sahne.",
      "Three acts, three scenes each.",
    ],
    items: [
      P("I. Perde", "Act I"),
      C("Sahne 1", "Scene 1"),
      C("Sahne 2", "Scene 2"),
      C("Sahne 3", "Scene 3"),
      P("II. Perde", "Act II"),
      C("Sahne 4", "Scene 4"),
      C("Sahne 5", "Scene 5"),
      C("Sahne 6", "Scene 6"),
      P("III. Perde", "Act III"),
      C("Sahne 7", "Scene 7"),
      C("Sahne 8", "Scene 8"),
      C("Sahne 9", "Scene 9"),
    ],
  },
];

export const templateById = (id: string): Template | undefined =>
  templates.find((t) => t.id === id);
