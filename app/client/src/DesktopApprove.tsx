import { useState } from "react";
import { type Lang, t } from "./i18n";
import { desktopCopy } from "./i18n/desktop";
import { copyLang } from "./i18n/fallback";
import { desktopRequest } from "./desktop";
import { useStore } from "./store";
import { api } from "./sync";

/** Web side of desktop sign-in: the signed-in writer approves the app, which receives a one-time code. */
export function DesktopApprove({ lang, onSignIn }: { lang: Lang; onSignIn: () => void }) {
  const account = useStore((s) => s.account);
  const [req, setReq] = useState(() => desktopRequest(location.search));
  const [state, setState] = useState<"ask" | "done" | "failed">("ask");
  if (!req) return null;
  const c = desktopCopy[copyLang(lang, desktopCopy)];
  const close = () => {
    history.replaceState(null, "", location.pathname);
    setReq(null);
  };
  const approve = async () => {
    const r = await api<{ code?: string }>("/auth/desktop/code", { body: { challenge: req.challenge } });
    if (!r.data.code) return setState("failed");
    setState("done");
    history.replaceState(null, "", location.pathname);
    location.href = `http://127.0.0.1:${req.port}/?code=${encodeURIComponent(r.data.code)}&state=${encodeURIComponent(req.state)}`;
  };
  return (
    <div className="modal-back">
      <div className="modal" role="dialog" aria-label={c.title}>
        <div className="modal-head"><h2>{c.title}</h2></div>
        {state === "done" ? (
          <p className="muted">{c.done}</p>
        ) : !account ? (
          <>
            <p className="muted">{c.signInFirst}</p>
            <button className="btn primary" onClick={onSignIn}>{t(lang, "signIn")}</button>
            <button className="btn" onClick={close}>{c.cancel}</button>
          </>
        ) : (
          <>
            <p className="muted">{c.ask}</p>
            <p><strong>{account.name}</strong></p>
            <button className="btn primary" onClick={() => void approve()}>{c.approve}</button>
            <button className="btn" onClick={close}>{c.cancel}</button>
            {state === "failed" && <p className="muted" role="alert">{t(lang, "failed")}</p>}
          </>
        )}
      </div>
    </div>
  );
}
