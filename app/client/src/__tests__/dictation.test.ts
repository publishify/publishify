import { describe, expect, it } from "vitest";
import { applyVoiceCommands } from "../dictation";

describe("sesle yazma: komutlar", () => {
  it("punctuation commands turn into marks", () => {
    expect(
      applyVoiceCommands(
        "bug\u00fcn hava g\u00fczel nokta yar\u0131n ya\u011fmur ya\u011far m\u0131 soru i\u015fareti",
        "tr",
      ),
    ).toBe(
      "bug\u00fcn hava g\u00fczel. yar\u0131n ya\u011fmur ya\u011far m\u0131?",
    );
  });
  it("new line and new paragraph", () => {
    expect(
      applyVoiceCommands(
        "birinci yeni sat\u0131r ikinci yeni paragraf \u00fc\u00e7\u00fcnc\u00fc",
        "tr",
      ),
    ).toBe("birinci\nikinci\n\n\u00fc\u00e7\u00fcnc\u00fc");
  });
  it("comma", () =>
    expect(applyVoiceCommands("elma virg\u00fcl armut", "tr")).toBe(
      "elma, armut",
    ));
  it("English", () =>
    expect(applyVoiceCommands("hello comma world period", "en")).toBe(
      "hello, world.",
    ));
});
