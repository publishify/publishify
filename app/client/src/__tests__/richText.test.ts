import { describe, expect, it } from "vitest";
import { mathHtml, richMarkdown, videoEmbed } from "../richText";

describe("rich text", () => {
  it("turns video links into players", () => {
    expect(videoEmbed("https://youtu.be/dQw4w9WgXcQ")).toEqual({ kind: "frame", src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" });
    expect(videoEmbed("https://vimeo.com/123456")?.src).toBe("https://player.vimeo.com/video/123456");
    expect(videoEmbed("https://example.com/clip.mp4")?.kind).toBe("video");
    expect(videoEmbed("https://example.com/photo.jpg")).toBeNull();
  });
  it("renders formulas as MathML for exports and keeps prices alone", async () => {
    expect(await mathHtml("x^2", false, true)).toContain("<math");
    const { md, fill } = await richMarkdown("Area $\\pi r^2$ costs 5 $ and 6 $.");
    expect(fill(md)).toContain("<math");
    expect(fill(md)).toContain("costs 5 $ and 6 $.");
  });
});
