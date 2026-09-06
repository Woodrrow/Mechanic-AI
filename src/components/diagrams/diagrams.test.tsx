import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DIAGRAM_LABELS } from "@/lib/jobs/diagrams";
import type { DiagramId } from "@/lib/jobs/types";
import { Diagram } from "./index";

const IDS = Object.keys(DIAGRAM_LABELS) as DiagramId[];

describe("diagrams", () => {
  it.each(IDS)("%s renders with default labels and a numbered key", (id) => {
    const html = renderToStaticMarkup(<Diagram id={id} />);
    expect(html).toContain("<svg");
    expect(html).toContain("<title");
    expect(html).toContain("<figcaption");
    const keys = Object.keys(DIAGRAM_LABELS[id]);
    expect((html.match(/<li class/g) ?? []).length).toBe(keys.length);
    expect(html).not.toMatch(/\d+\s?Nm/);
  });

  it("uses model-supplied labels where given and defaults elsewhere", () => {
    const html = renderToStaticMarkup(
      <Diagram id="disc-brake-corner" labels={{ guidePins: "Two guide-pin bolts, usually 7 mm hex", caliper: null }} />,
    );
    expect(html).toContain("Two guide-pin bolts, usually 7 mm hex");
    expect(html).toContain("Caliper: houses the piston");
  });
});
