import { copyLang } from "./i18n/fallback";
import { pluginCopy } from "./i18n/plugin";
import { useStore } from "./store";

const PLUGIN_URL = "https://github.com/publishify/plugin";

/** The editorial board lives in the writer's own AI now; this tab says how to reach it. */
export function BoardPanel() {
  const s = useStore();
  const t = pluginCopy[copyLang(s.settings.lang, pluginCopy)];
  return (
    <>
      <h3>{t.title}</h3>
      <p>{t.intro}</p>
      <ol>
        <li>{t.step1}</li>
        <li>{t.step2}</li>
        <li>{t.step3}</li>
      </ol>
      <a className="btn" href={PLUGIN_URL} target="_blank" rel="noreferrer">
        {t.link}
      </a>
    </>
  );
}
