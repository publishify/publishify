import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { resetGoogleKeys, verifyGoogleToken } from "../src/google";

const CLIENT = "client-123.apps.googleusercontent.com";
const NOW = Date.UTC(2026, 10, 13, 12);
let privateKey: CryptoKey;
let jwks: { keys: JsonWebKey[] };

const enc = (o: unknown) =>
  Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");

async function token(claims: Record<string, unknown>, kid = "k1", key = privateKey) {
  const head = enc({ alg: "RS256", kid, typ: "JWT" });
  const body = enc(claims);
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${head}.${body}`),
  );
  return `${head}.${body}.${Buffer.from(sig).toString("base64url")}`;
}
const good = {
  iss: "https://accounts.google.com",
  aud: CLIENT,
  exp: NOW / 1000 + 600,
  sub: "google-sub-1",
  email: "writer@example.com",
  email_verified: true,
  name: "Writer",
};
const fakeFetch = async () =>
  new Response(JSON.stringify(jwks), {
    headers: { "cache-control": "public, max-age=100" },
  });
const verify = (t: string) => verifyGoogleToken(t, CLIENT, fakeFetch, NOW);

beforeAll(async () => {
  const pair = (await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  privateKey = pair.privateKey;
  const pub = (await crypto.subtle.exportKey("jwk", pair.publicKey)) as JsonWebKey;
  jwks = { keys: [{ ...pub, kid: "k1" } as JsonWebKey] };
});
beforeEach(() => resetGoogleKeys());

describe("Google ID token", () => {
  it("accepts a valid token", async () => {
    expect(await verify(await token(good))).toEqual({
      sub: "google-sub-1",
      email: "writer@example.com",
      name: "Writer",
    });
  });
  it("rejects another app's token", async () => {
    expect(await verify(await token({ ...good, aud: "other" }))).toBeNull();
  });
  it("rejects an expired token", async () => {
    expect(await verify(await token({ ...good, exp: NOW / 1000 - 1 }))).toBeNull();
  });
  it("rejects a foreign issuer", async () => {
    expect(await verify(await token({ ...good, iss: "evil.example" }))).toBeNull();
  });
  it("rejects an unverified email", async () => {
    expect(await verify(await token({ ...good, email_verified: false }))).toBeNull();
  });
  it("rejects an unknown key id", async () => {
    expect(await verify(await token(good, "k2"))).toBeNull();
  });
  it("rejects a forged signature", async () => {
    const other = (await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    )) as CryptoKeyPair;
    expect(await verify(await token(good, "k1", other.privateKey))).toBeNull();
  });
  it("rejects a tampered payload", async () => {
    const [h, , s] = (await token(good)).split(".");
    const forged = `${h}.${enc({ ...good, sub: "someone-else" })}.${s}`;
    expect(await verify(forged)).toBeNull();
  });
  it("rejects garbage", async () => {
    expect(await verify("not-a-token")).toBeNull();
  });
});
