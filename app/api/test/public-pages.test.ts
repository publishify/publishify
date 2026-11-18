import { describe, expect, it } from "vitest";
import { app } from "../src/app";

describe("public reading page gate", () => {
  for (const [path, method] of [["/api/publish", "GET"], ["/api/publish/book", "PUT"], ["/k/example", "GET"], ["/k/example/1", "GET"]]) {
    it(`rejects ${method} ${path} before touching manuscript storage`, async () => {
      const res = await app.request(path!, { method: method! }, { ENVIRONMENT: "production", PUBLIC_PAGES_ENABLED: "false" } as never);
      expect(res.status).toBe(404);
      expect(await res.json()).toMatchObject({ error: { code: "public_pages_disabled" } });
    });
  }
});
