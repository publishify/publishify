import { describe, it, expect, vi } from "vitest";
vi.mock("idb-keyval", () => {
  const values = new Map<string, unknown>();
  return {
    get: vi.fn(async (k: string) => structuredClone(values.get(k))),
    set: vi.fn(async (k: string, value: unknown) => {
      values.set(k, structuredClone(value));
    }),
  };
});
import { useStore, switchWorkspace, flushLocal } from "../store";
import { set, get } from "idb-keyval";
describe("workspace isolation", () => {
  it("keeps guest and two signed-in libraries separate", async () => {
    const guest = useStore.getState().addBook();
    await flushLocal();
    await switchWorkspace({ id: "a", name: "A" });
    expect(useStore.getState().books).toHaveLength(0);
    const a = useStore.getState().addBook();
    await flushLocal();
    await switchWorkspace({ id: "b", name: "B" });
    expect(useStore.getState().books).toHaveLength(0);
    await switchWorkspace({ id: "a", name: "A" });
    expect(useStore.getState().books[0]!.id).toBe(a);
    await switchWorkspace(null);
    expect(useStore.getState().books[0]!.id).toBe(guest);
  });
  it("preserves the active workspace when a target read fails", async () => {
    const before = useStore.getState().books;
    vi.mocked(get).mockRejectedValueOnce(Error("unavailable"));
    await expect(switchWorkspace({ id: "c", name: "C" })).rejects.toThrow();
    expect(useStore.getState().books).toBe(before);
    expect(useStore.getState().account).toBeNull();
  });
  it("shows a failed save instead of reporting saved", async () => {
    vi.mocked(set).mockRejectedValueOnce(Error("full"));
    useStore.getState().setSettings({ fontSize: 21 });
    await expect(flushLocal()).rejects.toThrow("full");
    await vi.waitFor(() => expect(useStore.getState().saveError).toBe(true));
    expect(useStore.getState().saving).toBe(false);
  });
});

describe("in-flight account changes", () => {
  it("discards an old accounts delayed library response", async () => {
    await switchWorkspace({ id: "old", name: "Old" });
    let finish: ((r: Response) => void) | undefined;
    const pending = new Promise<Response>((resolve) => {
      finish = resolve;
    });
    const fetchMock = vi.fn(() => pending);
    vi.stubGlobal("fetch", fetchMock);
    try {
      const { syncAll } = await import("../sync");
      const sync = syncAll();
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
      await switchWorkspace({ id: "new", name: "New" });
      finish!(
        new Response(
          JSON.stringify({
            books: [
              { id: "old-book", title: "Old private title", author: "Old" },
            ],
          }),
          { headers: { "content-type": "application/json" } },
        ),
      );
      await sync;
      expect(useStore.getState().account?.id).toBe("new");
      expect(useStore.getState().books).toHaveLength(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
