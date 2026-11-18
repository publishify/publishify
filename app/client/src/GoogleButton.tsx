import { useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID, loadGsi } from "./drive";
import { type Lang, t } from "./i18n";
import { api } from "./sync";

export type GoogleResult = {
  user?: { id: string; name: string };
  recoveryCode?: string;
  linked?: boolean;
};

/** Google's own "Sign in with Google" button; the server verifies the token it returns. */
export function GoogleButton({
  lang,
  onDone,
}: {
  lang: Lang;
  onDone: (r: GoogleResult) => void | Promise<void>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  done.current = onDone;
  const [msg, setMsg] = useState("");
  useEffect(() => {
    let live = true;
    loadGsi()
      .then(() => {
        if (!live || !box.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: "popup",
          callback: (r) => {
            if (!r.credential) return;
            setMsg("");
            void api<GoogleResult & { error?: string }>("/auth/google", {
              body: { credential: r.credential },
            }).then(async (res) => {
              if (res.status === 200) await done.current(res.data);
              else if (res.status === 409) setMsg(t(lang, "googleElsewhere"));
              else setMsg(t(lang, "googleFail"));
            });
          },
        });
        window.google.accounts.id.renderButton(box.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          locale: lang,
        });
      })
      .catch(() => live && setMsg(t(lang, "googleFail")));
    return () => {
      live = false;
    };
  }, [lang]);
  return (
    <div className="google-signin">
      <div ref={box} />
      {msg && (
        <p className="muted" role="alert">
          {msg}
        </p>
      )}
    </div>
  );
}
