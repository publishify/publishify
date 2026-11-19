/**
 * The desktop app (Tauri). The editor runs from the app's own files, so the account API is reached
 * at write.publishify.app with a bearer token kept in the system keychain. Signing in happens in
 * the system browser, where passkeys and Google work as on the web (see publishify/desktop: src-tauri/src/account.rs).
 */
type Tauri = { core: { invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> } };
export const tauri = (): Tauri | undefined => (window as unknown as { __TAURI__?: Tauri }).__TAURI__;

export const API_ORIGIN = "https://write.publishify.app";

let token: string | null | undefined;

/** The account session on this computer, or null when signed out. */
export async function desktopToken(): Promise<string | null> {
  const t = tauri();
  if (!t) return null;
  if (token === undefined) token = (await t.core.invoke<string | null>("account_token").catch(() => null)) ?? null;
  return token;
}

/** Opens the browser to sign in; resolves once the app holds a session. */
export async function desktopSignIn(): Promise<void> {
  token = await tauri()!.core.invoke<string>("account_sign_in");
}

export async function desktopSignOut(): Promise<void> {
  token = null;
  await tauri()?.core.invoke("account_sign_out");
}

/** Web side: the query a desktop app opens, `?desktop=<port>&state=…&challenge=…`, or null. */
export function desktopRequest(search: string): { port: number; state: string; challenge: string } | null {
  const q = new URLSearchParams(search);
  const port = Number(q.get("desktop"));
  const state = q.get("state") ?? "";
  const challenge = q.get("challenge") ?? "";
  if (!Number.isInteger(port) || port < 1024 || port > 65535) return null;
  if (!/^[\w-]{16,64}$/.test(state) || !/^[\w-]{43}$/.test(challenge)) return null;
  return { port, state, challenge };
}
