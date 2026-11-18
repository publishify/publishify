import { describe, expect, it } from "vitest";
import { app } from "../src/app";

const env = () => ({ ENVIRONMENT: "local" }) as never;

describe("health", () => {
  it("reports the app worker and its environment", async () => {
    const res = await app.request(
      "/api/health",
      {},
      env(),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ worker: "app", environment: "local" });
  });
});
