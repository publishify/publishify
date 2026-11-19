import { describe, expect, it } from "vitest";
import { isBlank } from "../drive";

describe("blank chapters on first Drive connect", () => {
  it("empty and template-only chapters are blank", () => {
    expect(isBlank("")).toBe(true);
    expect(isBlank("# Opening\n\n")).toBe(true);
  });
  it("any written line is not blank", () => {
    expect(isBlank("# Opening\n\nThe desktop app is lovely")).toBe(false);
    expect(isBlank("#hashtag")).toBe(false);
  });
});
