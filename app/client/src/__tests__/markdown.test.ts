import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { continueMarkup, nextMarker } from "../markdown";

const enter = (doc: string) => {
  let state = EditorState.create({ doc, selection: { anchor: doc.length } });
  const ok = continueMarkup({ state, dispatch: (tr) => (state = tr.state) });
  return { ok, doc: state.doc.toString() };
};

describe("markdown lists", () => {
  it("continues bullet, numbered, task and quote lines", () => {
    expect(enter("- one").doc).toBe("- one\n- ");
    expect(enter("9. nine").doc).toBe("9. nine\n10. ");
    expect(enter("  * [x] done").doc).toBe("  * [x] done\n  * [ ] ");
    expect(enter("> said").doc).toBe("> said\n> ");
  });
  it("ends the list on an empty item", () => {
    expect(enter("- one\n- ").doc).toBe("- one\n");
  });
  it("leaves plain lines to the default Enter", () => {
    expect(enter("Plain text").ok).toBe(false);
    expect(nextMarker("-not a list")).toBeNull();
  });
});
