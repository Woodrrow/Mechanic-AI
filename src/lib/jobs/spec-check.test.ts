import { describe, expect, it } from "vitest";
import { checkGuide, checkText } from "./spec-check";
import { loadReferenceGuide } from "./guide-schema.test";

const allowed = new Set(["1596", "1.6", "2015"]);

describe("checkText", () => {
  it("flags torque, capacity, pressure and part numbers", () => {
    expect(checkText("p", "Tighten the guide pins to 35 Nm.", allowed).map((v) => v.kind)).toEqual(["torque"]);
    expect(checkText("p", "Torque to 26 lb-ft", allowed).map((v) => v.kind)).toEqual(["torque"]);
    expect(checkText("p", "Refill with 1.1 litres of fluid", allowed).map((v) => v.kind)).toEqual(["capacity"]);
    expect(checkText("p", "Inflate to 32 psi", allowed).map((v) => v.kind)).toEqual(["pressure"]);
    expect(checkText("p", "Order part number BV61-2K021-AA", allowed).map((v) => v.kind)).toContain("part_number");
    expect(checkText("p", "Fit pads BV61-2K021-AA from Ford", allowed).map((v) => v.kind)).toEqual(["part_number"]);
  });

  it("treats mm as a spec only near wear or minimum wording", () => {
    expect(checkText("p", "You need a 7 mm hex key.", allowed)).toEqual([]);
    expect(checkText("p", "Use a 13mm socket for the carrier bolts.", allowed)).toEqual([]);
    expect(checkText("p", "Minimum disc thickness is 22 mm.", allowed).map((v) => v.kind)).toEqual(["thickness"]);
    expect(checkText("p", "Replace pads worn to 3mm.", allowed).map((v) => v.kind)).toEqual(["thickness"]);
  });

  it("allows numbers present in the grounding facts", () => {
    expect(checkText("p", "The 1.6 litre engine (1596 cc) fitted from 2015.", allowed)).toEqual([]);
    expect(checkText("p", "The 2.0 litre engine", allowed).map((v) => v.kind)).toEqual(["capacity"]);
  });
});

describe("checkGuide", () => {
  it("passes the reference guide and blocks a figure with a value", () => {
    const guide = loadReferenceGuide();
    const output = { scope: guide.scope, content: guide.content };
    expect(checkGuide(output, { allowedNumbers: ["1596", "1.6", "2015"], groundedFigures: [] }).ok).toBe(true);

    const withValue = {
      ...output,
      content: { ...output.content, figures: [{ ...output.content.figures[0], value: 28 }] },
    };
    const result = checkGuide(withValue, { allowedNumbers: [], groundedFigures: [] });
    expect(result.ok).toBe(false);
    expect(result.violations[0]).toMatchObject({ kind: "figure_value", path: "content.figures[0].value" });

    const grounded = checkGuide(withValue, {
      allowedNumbers: [],
      groundedFigures: [{ name: "Caliper guide-pin bolt torque", unit: "Nm", value: 28, source: "owner-supplied manual" }],
    });
    expect(grounded.ok).toBe(true);
  });

  it("reports the path of a rogue figure in a step", () => {
    const guide = loadReferenceGuide();
    const steps = [...guide.content.steps];
    steps[5] = { ...steps[5], instruction: `${steps[5].instruction} Torque them to 30 Nm.` };
    const result = checkGuide({ scope: guide.scope, content: { ...guide.content, steps } }, { allowedNumbers: [], groundedFigures: [] });
    expect(result.violations).toEqual([{ path: "content.steps[5].instruction", kind: "torque", text: "30 Nm" }]);
  });
});
