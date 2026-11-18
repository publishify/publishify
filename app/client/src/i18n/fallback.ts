/**
 * Which language a translated panel uses: the requested one if it exists; otherwise Turkish for
 * Ottoman and Kurdish (their readers mostly read Turkish), English for the rest.
 */
export function copyLang<K extends string>(
  lang: string,
  copy: Partial<Record<K, unknown>> & Record<"tr" | "en", unknown>,
): K | "tr" | "en" {
  if (lang in copy) return lang as K;
  return lang === "ota" || lang === "ku" ? "tr" : "en";
}
