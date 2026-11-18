import { describe, it, expect, vi } from "vitest";
import { createCoalescer, createWriter, workspaceKey } from "../persistence";
describe("local durability", () => {
  it("surfaces a rejected write and can recover on the next write", async () => {
    let n = 0;
    const w = createWriter(async () => {
      if (++n === 1) throw Error("full");
    });
    await expect(w.save("a", 1)).rejects.toThrow("full");
    await expect(w.save("a", 2)).resolves.toBeUndefined();
  });
  it("serializes snapshots across workspaces", async () => {
    const values: string[] = [];
    const w = createWriter(async (k: string, v: number) => {
      await new Promise((r) => setTimeout(r, 2));
      values.push(k + v);
    });
    await Promise.all([w.save("a", 1), w.save("a", 2), w.save("b", 3)]);
    expect(values).toEqual(["a1", "a2", "b3"]);
  });
  it("never shares guest or account keys", () => {
    expect(
      new Set([workspaceKey(null), workspaceKey("a"), workspaceKey("b")]).size,
    ).toBe(3);
  });
  it("writes once per window while typing, and at once when flushed", () => {
    vi.useFakeTimers();
    try {
      let writes = 0;
      const save = createCoalescer(() => writes++, 600);
      for (let i = 0; i < 50; i++) save.request();
      expect(writes).toBe(0);
      vi.advanceTimersByTime(600);
      expect(writes).toBe(1);
      save.request();
      save.flush();
      expect(writes).toBe(2);
      vi.advanceTimersByTime(600);
      expect(writes).toBe(2);
      save.flush();
      expect(writes).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
