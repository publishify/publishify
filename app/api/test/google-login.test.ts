import { URL as NodeURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

const identity = vi.hoisted(() => ({
  current: null as null | { sub: string; email: string; name: string },
}));
vi.mock("../src/google", () => ({
  verifyGoogleToken: async () => identity.current,
}));
const { googleLogin, sha256 } = await import("../src/auth");
import type { AppEnv, Env } from "../src/types";

function database() {
  const db = new DatabaseSync(":memory:");
  for (const m of ["0001_init.sql", "0006_google_accounts.sql"])
    db.exec(
      readFileSync(new NodeURL(`../migrations/${m}`, import.meta.url), "utf8"),
    );
  const prepare = (sql: string) => {
    let args: unknown[] = [];
    const q = {
      bind(...a: unknown[]) {
        args = a;
        return q;
      },
      async first() {
        return db.prepare(sql).get(...(args as never[])) ?? null;
      },
      async run() {
        db.prepare(sql).run(...(args as never[]));
        return {};
      },
    };
    return q;
  };
  return {
    db,
    adapter: {
      prepare,
      async batch(statements: { run: () => Promise<unknown> }[]) {
        db.exec("BEGIN");
        try {
          for (const s of statements) await s.run();
          db.exec("COMMIT");
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
      },
    },
  };
}

async function call(adapter: unknown, cookie?: string) {
  const app = new Hono<AppEnv>();
  app.post("/google", (c) => googleLogin(c, "token"));
  const res = await app.request(
    "https://write.publishify.app/google",
    { method: "POST", headers: cookie ? { cookie } : {} },
    { DB: adapter, GOOGLE_CLIENT_ID: "client" } as unknown as Env,
  );
  return {
    status: res.status,
    body: (await res.json()) as Record<string, unknown>,
    cookie: res.headers.get("set-cookie"),
  };
}

beforeEach(() => {
  identity.current = { sub: "g1", email: "w@example.com", name: "Writer" };
});

describe("Sign in with Google", () => {
  it("creates a user with a recovery code on first use, then signs the same user in", async () => {
    const { db, adapter } = database();
    const first = await call(adapter);
    expect(first.status).toBe(200);
    expect(first.body.recoveryCode).toMatch(/^[A-Z2-9]{5}(-[A-Z2-9]{5}){3}$/);
    expect(first.cookie).toContain("pf_session=");
    const again = await call(adapter);
    expect(again.status).toBe(200);
    expect(again.body.recoveryCode).toBeUndefined();
    expect((again.body.user as { id: string }).id).toBe(
      (first.body.user as { id: string }).id,
    );
    expect(db.prepare("SELECT COUNT(*) AS n FROM users").get()).toEqual({ n: 1 });
  });

  it("links Google to the signed-in passkey user", async () => {
    const { db, adapter } = database();
    db.prepare(
      "INSERT INTO users (id, name, recovery_hash, created) VALUES ('u1','Passkey user','h',1)",
    ).run();
    db.prepare(
      "INSERT INTO sessions (id_hash, user_id, expires) VALUES (?, 'u1', ?)",
    ).run(await sha256("tok"), Date.now() + 60_000);
    const r = await call(adapter, "pf_session=tok");
    expect(r.body).toMatchObject({ linked: true, user: { id: "u1" } });
    expect(
      db.prepare("SELECT user_id FROM google_accounts WHERE sub='g1'").get(),
    ).toEqual({ user_id: "u1" });
  });

  it("refuses a Google account that already belongs to someone else", async () => {
    const { db, adapter } = database();
    db.prepare(
      "INSERT INTO users (id, name, recovery_hash, created) VALUES ('u1','A','h1',1), ('u2','B','h2',1)",
    ).run();
    db.prepare(
      "INSERT INTO google_accounts (sub, user_id, email, created) VALUES ('g1','u2','',1)",
    ).run();
    db.prepare(
      "INSERT INTO sessions (id_hash, user_id, expires) VALUES (?, 'u1', ?)",
    ).run(await sha256("tok"), Date.now() + 60_000);
    const r = await call(adapter, "pf_session=tok");
    expect(r.status).toBe(409);
  });

  it("rejects an invalid token", async () => {
    identity.current = null;
    const { db, adapter } = database();
    expect((await call(adapter)).status).toBe(400);
    expect(db.prepare("SELECT COUNT(*) AS n FROM users").get()).toEqual({ n: 0 });
  });
});
