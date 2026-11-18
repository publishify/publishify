// Kitab\u0131n yaz\u0131 dili: y\u00f6n (RTL), yaz\u0131m denetimi, sesle yazma ve d\u0131\u015fa aktarma buna g\u00f6re ayarlan\u0131r.
// S\u0131ra: Arap\u00e7a, Osmanl\u0131ca, T\u00fcrk\u00e7e, sonra di\u011ferleri. Aray\u00fcz\u00fc olan her dil yaz\u0131 dili de olur; Kurmancî ve Zazaca yaln\u0131zca yaz\u0131 dilidir (aray\u00fcz \u00e7evirisi yok).
export type BookLang =
  | "ar"
  | "ota"
  | "tr"
  | "en"
  | "de"
  | "fr"
  | "ru"
  | "ja"
  | "ku"
  | "zza";

export interface LangInfo {
  code: BookLang;
  native: string;
  tr: string;
  en: string;
  rtl: boolean;
  speech?: string;
}

export const bookLangs: LangInfo[] = [
  {
    code: "ar",
    native: "العربية",
    tr: "Arap\u00e7a",
    en: "Arabic",
    rtl: true,
    speech: "ar-SA",
  },
  {
    code: "ota",
    native: "لسان عثمانى",
    tr: "Osmanl\u0131ca (Arap harfli)",
    en: "Ottoman Turkish",
    rtl: true,
  },
  {
    code: "tr",
    native: "T\u00fcrk\u00e7e",
    tr: "T\u00fcrk\u00e7e",
    en: "Turkish",
    rtl: false,
    speech: "tr-TR",
  },
  {
    code: "en",
    native: "English",
    tr: "\u0130ngilizce",
    en: "English",
    rtl: false,
    speech: "en-US",
  },
  {
    code: "de",
    native: "Deutsch",
    tr: "Almanca",
    en: "German",
    rtl: false,
    speech: "de-DE",
  },
  {
    code: "fr",
    native: "Fran\u00e7ais",
    tr: "Frans\u0131zca",
    en: "French",
    rtl: false,
    speech: "fr-FR",
  },
  {
    code: "ru",
    native: "Русский",
    tr: "Rus\u00e7a",
    en: "Russian",
    rtl: false,
    speech: "ru-RU",
  },
  {
    code: "ja",
    native: "日本語",
    tr: "Japonca",
    en: "Japanese",
    rtl: false,
    speech: "ja-JP",
  },
  // Zazaca dilbilimde ayr\u0131 bir dil say\u0131l\u0131r; K\u00fcrt\u00e7enin leh\u00e7esi olarak de\u011fil, yan\u0131nda listelenir.
  {
    code: "ku",
    native: "Kurdî (Kurmancî)",
    tr: "K\u00fcrt\u00e7e — Kurmancî (Latin)",
    en: "Kurdish — Kurmanji (Latin)",
    rtl: false,
  },
  {
    code: "zza",
    native: "Zazakî (K\u0131rmancki)",
    tr: "Zazaca (K\u0131rmancki / Dimilkî)",
    en: "Zazaki",
    rtl: false,
  },
];

const byCode = new Map(bookLangs.map((l) => [l.code, l] as const));
export const isBookLang = (c: unknown): c is BookLang =>
  typeof c === "string" && byCode.has(c as BookLang);
export const langInfo = (c: BookLang): LangInfo =>
  byCode.get(c) ?? byCode.get("tr")!;
export const isRtl = (c: BookLang): boolean => langInfo(c).rtl;
/** HTML lang \u00f6zniteli\u011fi: Osmanl\u0131ca Arap harfiyle, Kurmancî Latin harfiyle yaz\u0131ld\u0131\u011f\u0131 i\u00e7in betik etiketi eklenir. */
export const htmlLang = (c: BookLang): string =>
  c === "ota" ? "ota-Arab" : c === "ku" ? "ku-Latn" : c;
/** Kitab\u0131n dili; listede olmayan (eski) bir de\u011ferse aray\u00fcz diline, o da uygun de\u011filse T\u00fcrk\u00e7e'ye d\u00fc\u015fer. */
export const bookLangOf = (b: { lang?: string }, ui: string): BookLang =>
  isBookLang(b.lang) ? b.lang : isBookLang(ui) ? ui : "tr";
