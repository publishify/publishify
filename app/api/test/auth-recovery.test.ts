import { URL as NodeURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { recover, sha256 } from "../src/auth";
import type { AppEnv, Env } from "../src/types";

function database() {
  const db = new DatabaseSync(":memory:");
  db.exec(
    readFileSync(
      new NodeURL("../migrations/0001_init.sql", import.meta.url),
      "utf8",
    ),
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
        const r = db.prepare(sql).run(...(args as never[]));
        return { meta: { changes: Number(r.changes) } };
      },
    };
    return q;
  };
  return { db, adapter: { prepare } };
}

const normalize = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "");

describe("account recovery", () => {
  it("ends every existing session and starts exactly one new one", async () => {
    const { db, adapter } = database();
    const code = "ABCDE-FGHJK-LMNPQ-RSTUV";
    db.prepare(
      "INSERT INTO users (id, name, recovery_hash, created) VALUES (?, ?, ?, ?)",
    ).run("u1", "Writer", await sha256(normalize(code)), 1);
    db.prepare(
      "INSERT INTO users (id, name, recovery_hash, created) VALUES (?, ?, ?, ?)",
    ).run("u2", "Other", await sha256("OTHER"), 1);
    const later = Date.now() + 86_400_000;
    for (const [id, user] of [
      ["lost-phone", "u1"],
      ["old-laptop", "u1"],
      ["someone-else", "u2"],
    ] as const)
      db.prepare(
        "INSERT INTO sessions (id_hash, user_id, expires) VALUES (?, ?, ?)",
      ).run(id, user, later);

    const app = new Hono<AppEnv>();
    app.post("/recover", (c) => recover(c, code));
    const res = await app.request(
      "https://app.test/recover",
      { method: "POST" },
      { DB: adapter } as unknown as Env,
    );

    expect(res.status).toBe(200);
    const mine = db
      .prepare("SELECT id_hash FROM sessions WHERE user_id = 'u1'")
      .all() as { id_hash: string }[];
    expect(mine).toHaveLength(1);
    expect(mine.map((s) => s.id_hash)).not.toContain("lost-phone");
    expect(mine.map((s) => s.id_hash)).not.toContain("old-laptop");
    const theirs = db
      .prepare("SELECT id_hash FROM sessions WHERE user_id = 'u2'")
      .all();
    expect(theirs).toHaveLength(1);
  });

  it("keeps sessions when the code is wrong", async () => {
    const { db, adapter } = database();
    db.prepare(
      "INSERT INTO users (id, name, recovery_hash, created) VALUES (?, ?, ?, ?)",
    ).run("u1", "Writer", await sha256("RIGHTCODE"), 1);
    db.prepare(
      "INSERT INTO sessions (id_hash, user_id, expires) VALUES (?, ?, ?)",
    ).run("phone", "u1", Date.now() + 86_400_000);

    const app = new Hono<AppEnv>();
    app.post("/recover", (c) => recover(c, "WRONG-CODE"));
    const res = await app.request(
      "https://app.test/recover",
      { method: "POST" },
      { DB: adapter } as unknown as Env,
    );

    expect(res.status).toBe(400);
    expect(db.prepare("SELECT COUNT(*) AS n FROM sessions").get()).toEqual({
      n: 1,
    });
  });
});
