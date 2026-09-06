import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { REGISTRATION_FIXTURES } from "@/lib/providers/fixtures";
import type { DiagnoseApiResponse } from "./route";
import { POST } from "./route";

const post = (body: unknown) =>
  POST(new NextRequest("http://localhost/api/diagnose", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));

describe("POST /api/diagnose", () => {
  it("ranks causes from the answers", async () => {
    const res = await post({
      symptomId: "grinding-when-braking",
      answers: { when: "only-braking", character: "metallic-grind", feel: "nothing" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as DiagnoseApiResponse;
    expect(body.ok).toBe(true);
    if (!body.ok) return;
    expect(body.result.causes[0].cause.id).toBe("worn-brake-pads");
    expect(body.result.causes[0].cause.jobId).toBe("front-brake-pads");
  });

  it("uses the car's MOT record when the browser sends it", async () => {
    const body = (await (
      await post({
        symptomId: "grinding-when-braking",
        answers: { when: "only-braking" },
        motRecord: REGISTRATION_FIXTURES.AB15CDE.mot,
      })
    ).json()) as DiagnoseApiResponse;
    if (!body.ok) throw new Error("not ok");
    const pads = body.result.causes.find((c) => c.cause.id === "worn-brake-pads")!;
    expect(pads.motEvidence.join(" ")).toContain("Brake pads wearing thin");
  });

  it("decodes fault codes and reports what it could not read", async () => {
    const body = (await (
      await post({ symptomId: "engine-warning-light", answers: { "steady-or-flashing": "flashing" }, codes: "P0301 BANANA" })
    ).json()) as DiagnoseApiResponse;
    if (!body.ok) throw new Error("not ok");
    expect(body.codes.codes[0].code).toBe("P0301");
    expect(body.codes.unrecognised).toEqual(["BANANA"]);
    expect(body.result.causes[0].cause.id).toBe("misfire-ignition");
  });

  it("returns the safety stop for a soft brake pedal", async () => {
    const body = (await (await post({ symptomId: "soft-brake-pedal", answers: {} })).json()) as DiagnoseApiResponse;
    if (!body.ok) throw new Error("not ok");
    expect(body.result.safetyStop?.title).toBe("Stop driving the car");
  });

  it("rejects bad requests", async () => {
    expect((await post({})).status).toBe(400);
    expect((await post({ symptomId: "nope" })).status).toBe(404);
  });
});
