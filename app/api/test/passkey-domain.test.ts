import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { rp } from "../src/auth";
import type { AppEnv, Env } from "../src/types";

async function relyingParty(url: string, vars: Partial<Env>) {
  const app = new Hono<AppEnv>();
  app.get("*", (c) => c.json(rp(c)));
  const res = await app.request(url, {}, vars as Env);
  return res.json();
}

describe("passkey relying party", () => {
  it("binds production passkeys to the parent domain", async () => {
    expect(
      await relyingParty("https://write.publishify.app/x", {
        ALLOWED_HOSTS: "write.publishify.app",
        RP_ID: "publishify.app",
      }),
    ).toEqual({ rpID: "publishify.app", origin: "https://write.publishify.app" });
  });

  it("uses the host itself when no RP_ID is set", async () => {
    expect(
      await relyingParty("https://staging.publishify.app/x", {
        ALLOWED_HOSTS: "staging.publishify.app",
      }),
    ).toEqual({
      rpID: "staging.publishify.app",
      origin: "https://staging.publishify.app",
    });
  });

  it("refuses hosts that are not allowed", async () => {
    expect(
      await relyingParty("https://evil.example/x", {
        ALLOWED_HOSTS: "write.publishify.app",
        RP_ID: "publishify.app",
      }),
    ).toBeNull();
  });

  it("refuses an RP_ID the host does not belong to", async () => {
    expect(
      await relyingParty("https://write.publishify.app/x", {
        ALLOWED_HOSTS: "write.publishify.app",
        RP_ID: "example.com",
      }),
    ).toBeNull();
    expect(
      await relyingParty("https://notpublishify.app/x", {
        ALLOWED_HOSTS: "notpublishify.app",
        RP_ID: "publishify.app",
      }),
    ).toBeNull();
  });
});
