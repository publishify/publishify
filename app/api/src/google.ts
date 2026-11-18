/**
 * Verifies a Google ID token (Sign in with Google) on the server: RS256 signature against Google's
 * published keys, audience, issuer, expiry and a verified email. No client secret is involved.
 */
const CERTS = "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

export type GoogleIdentity = { sub: string; email: string; name: string };
type Jwk = JsonWebKey & { kid?: string };
type Fetch = (url: string) => Promise<Response>;

let cache: { keys: Jwk[]; until: number } | null = null;
/** For tests: forget cached Google keys. */
export const resetGoogleKeys = () => {
  cache = null;
};

async function keys(fetchImpl: Fetch, now: number): Promise<Jwk[]> {
  if (cache && cache.until > now) return cache.keys;
  const r = await fetchImpl(CERTS);
  if (!r.ok) throw Error("google_keys");
  const maxAge = /max-age=(\d+)/.exec(r.headers.get("cache-control") ?? "");
  const body = (await r.json()) as { keys: Jwk[] };
  cache = { keys: body.keys, until: now + Number(maxAge?.[1] ?? 3600) * 1000 };
  return body.keys;
}

const b64 = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
};
const part = <T>(s: string) => JSON.parse(new TextDecoder().decode(b64(s))) as T;

export async function verifyGoogleToken(
  token: string,
  clientId: string,
  fetchImpl: Fetch = (u) => fetch(u),
  now = Date.now(),
): Promise<GoogleIdentity | null> {
  const [h, p, sig] = token.split(".");
  if (!h || !p || !sig) return null;
  let header: { alg?: string; kid?: string };
  let claims: {
    iss?: string;
    aud?: string;
    exp?: number;
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
  };
  try {
    header = part(h);
    claims = part(p);
  } catch {
    return null;
  }
  if (header.alg !== "RS256" || !header.kid) return null;
  const jwk = (await keys(fetchImpl, now)).find((k) => k.kid === header.kid);
  if (!jwk?.n || !jwk.e || jwk.kty !== "RSA") return null;
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64(sig),
    new TextEncoder().encode(`${h}.${p}`),
  );
  if (!ok) return null;
  if (!ISSUERS.has(claims.iss ?? "")) return null;
  if (claims.aud !== clientId) return null;
  if (!claims.exp || claims.exp * 1000 < now) return null;
  if (!claims.sub || !claims.email) return null;
  if (claims.email_verified !== true && claims.email_verified !== "true")
    return null;
  return {
    sub: claims.sub,
    email: claims.email,
    name: claims.name ?? claims.email.split("@")[0] ?? "",
  };
}
