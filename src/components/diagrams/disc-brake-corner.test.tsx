import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DiscBrakeCorner } from "./disc-brake-corner";

describe("DiscBrakeCorner", () => {
  it("renders the schematic with default and overridden labels", () => {
    const html = renderToStaticMarkup(<DiscBrakeCorner labels={{ guidePins: "Two guide-pin bolts, usually 7 mm hex" }} />);
    expect(html).toContain("<svg");
    expect(html).toContain("Two guide-pin bolts, usually 7 mm hex");
    expect(html).toContain("Carrier bracket");
    expect(html).toContain("Schematic, not to scale");
    expect((html.match(/<circle/g) ?? []).length).toBeGreaterThan(7);
  });
});
