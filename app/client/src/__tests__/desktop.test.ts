import { describe, expect, it } from "vitest";
import { desktopRequest } from "../desktop";

describe("desktop approval link", () => {
  const challenge = "a".repeat(43);
  it("reads a valid request", () => {
    expect(desktopRequest(`?desktop=51234&state=abcdefghijklmnop&challenge=${challenge}`)).toEqual({ port: 51234, state: "abcdefghijklmnop", challenge });
  });
  it("rejects bad ports and values", () => {
    expect(desktopRequest(`?desktop=80&state=abcdefghijklmnop&challenge=${challenge}`)).toBeNull();
    expect(desktopRequest(`?desktop=51234&state=a/b&challenge=${challenge}`)).toBeNull();
    expect(desktopRequest("")).toBeNull();
  });
});
