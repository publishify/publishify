import { URL as NodeURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { currentUser, desktopCode, desktopToken, sha256 } from "../src/auth";
import type { AppEnv, Env } from "../src/types";

function database() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new NodeURL("../migrations/0001_init.sql", import.meta.url), "utf8"));
  const prepare = (sql: string) => {
    let args: unknown[] = [];
    const q = {
      bind(...a: unknown[]) { args = a; return q; },
      async first() { return db.prepare(sql).get(...(args as never[])) ?? null; },
      async run() { const r = db.prepare(sql).run(...(args as never[])); return { meta: { changes: Number(r.changes) } }; },
    };
    return q;
  };
  db.prepare("INSERT INTO users (id, name, recovery_hash, created) VALUES ('u1', 'Writer', 'x', 1)").run();
  return { db, env: { DB: { prepare } } as unknown as Env };
}

const verifier = "v".repeat(48);

describe("desktop sign-in", () => {
  it("trades a one-time code and the right verifier for a session the bearer header opens", async () => {
    const { env } = database();
    const app = new Hono<AppEnv>();
    app.post("/code", async (c) => c.json({ code: await desktopCode(c, "u1", await sha256(verifier)) }));
    app.post("/token", async (c) => {
      const b = await c.req.json<{ code: string; verifier: string }>();
      return c.json({ token: await desktopToken(c, b.code, b.verifier) });
    });
    app.get("/me", async (c) => c.json(await currentUser(c)));
    const post = (p: string, body?: unknown) =>
      Promise.resolve(app.request(`https://app.test${p}`, { method: "POST", body: JSON.stringify(body ?? {}) }, env)).then((r: Response) => r.json() as Promise<Record<string, string | null>>);

    const { code } = await post("/code");
    expect((await post("/token", { code, verifier: "w".repeat(48) })).token).toBeNull();
    const again = (await post("/code")).code;
    const { token } = await post("/token", { code: again, verifier });
    expect(token).toBeTruthy();
    expect((await post("/token", { code: again, verifier })).token).toBeNull(); // one use only
    const me = await app.request("https://app.test/me", { headers: { authorization: `Bearer ${token}` } }, env);
    expect(await me.json()).toEqual({ id: "u1", name: "Writer" });
  });
});
