import { beforeAll, describe, expect, it } from "vitest";
import {
  detectUiLang,
  isRtlUi,
  isUiLang,
  langFromUrl,
  loadLang,
  t,
  uiLangs,
} from "../i18n";
import { ku } from "../i18n/ku";
import { syncCopy } from "../i18n/sync";
import { importCopy } from "../i18n/import";
import { publishingCopy } from "../i18n/publishing";
import { workspaceCopy } from "../i18n/workspace";
import { copyLang } from "../i18n/fallback";
import { ar } from "../i18n/extra";
import { de, fr, ja, ota, ru } from "../i18n/more";

describe("interface languages", () => {
  beforeAll(async () => {
    for (const l of uiLangs) await loadLang(l.code);
  });
  it("translated strings come from their own language", () => {
    expect(t("ar", "library")).toBe("المكتبة");
    expect(t("tr", "library")).toBe("Kitapl\u0131k");
  });
  it("every non-English interface language translates every string", () => {
    const keys = Object.keys(ar).length;
    for (const tr of [ar, ota, ku, de, fr, ru, ja])
      expect(Object.keys(tr).length).toBe(keys);
    for (const key of ["driveIntro", "googleFail", "trashNote"] as const) {
      expect(t("ar", key)).not.toBe(t("en", key));
      expect(t("ota", key)).not.toBe(t("tr", key));
      expect(t("ku", key)).not.toBe(t("tr", key));
    }
  });
  it("every panel exists in every interface language with the same fields as English", () => {
    const shape = (o: object): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        v && typeof v === "object" ? shape(v).map((x) => `${k}.${x}`) : [k],
      );
    for (const copy of [syncCopy, importCopy, publishingCopy, workspaceCopy])
      for (const l of ["ar", "ota", "ku", "de", "fr", "ru", "ja"] as const)
        expect(shape(copy[l]).sort(), l).toEqual(shape(copy.en).sort());
  });
  it("panels fall back to Turkish for Ottoman and Kurdish, English for others", () => {
    expect(copyLang("ku", { tr: 1, en: 2 })).toBe("tr");
    expect(copyLang("ota", { tr: 1, en: 2 })).toBe("tr");
    expect(copyLang("de", { tr: 1, en: 2 })).toBe("en");
    expect(copyLang("ar", { tr: 1, en: 2, ar: 3 })).toBe("ar");
  });
  it("a link can choose the interface language", () => {
    expect(langFromUrl("?lang=tr")).toBe("tr");
    expect(langFromUrl("?lang=ku&x=1")).toBe("ku");
    expect(langFromUrl("?lang=xx")).toBeNull();
    expect(langFromUrl("")).toBeNull();
  });
  it("order: Arabic, Ottoman Turkish, Turkish, then the others; Arabic and Ottoman Turkish are right-to-left", () => {
    expect(uiLangs.map((l) => l.code)).toEqual([
      "ar",
      "ota",
      "tr",
      "ku",
      "en",
      "de",
      "fr",
      "ru",
      "ja",
    ]);
    expect(isRtlUi("ar")).toBe(true);
    expect(isRtlUi("ota")).toBe(true);
    expect(isRtlUi("de")).toBe(false);
    expect(isRtlUi("tr")).toBe(false);
    expect(isRtlUi("ku")).toBe(false);
  });
  it("removed languages in old records are treated as invalid", () => {
    expect(isUiLang("az")).toBe(false);
    expect(isUiLang("fa")).toBe(false);
    expect(isUiLang("ar")).toBe(true);
  });
  it("selection from the browser language", () => {
    expect(detectUiLang("ar-SA")).toBe("ar");
    expect(detectUiLang("tr-TR")).toBe("tr");
    expect(detectUiLang("ku")).toBe("ku");
    expect(detectUiLang("de-DE")).toBe("de");
    expect(detectUiLang("ja-JP")).toBe("ja");
    expect(detectUiLang("es-ES")).toBe("en");
    expect(detectUiLang("fa-IR")).toBe("en");
  });
  it("no empty strings in the translation files", () => {
    for (const tr of [ar, ota, ku, de, fr, ru, ja])
      for (const [k, v] of Object.entries(tr)) expect(v, k).toBeTruthy();
  });
  it("new languages return their own text", () => {
    expect(t("de", "library")).toBe("Bibliothek");
    expect(t("ja", "library")).toBe("ライブラリ");
    expect(t("ru", "trash")).toBe("Корзина");
  });
});
