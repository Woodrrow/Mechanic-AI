import { describe, expect, it } from "vitest";
import { RULES } from "@/lib/mot/knowledge";
import { getJob, isGuideable, jobAppliesToFuel, JOB_IDS, jobForDefect, JOBS, jobsBySystem } from "./catalogue";
import { DIAGRAM_LABELS } from "./diagrams";

const all = Object.values(JOBS);

describe("job catalogue", () => {
  it("has unique ids, sane tiers and a decent spread", () => {
    expect(new Set(JOB_IDS).size).toBe(JOB_IDS.length);
    expect(all.length).toBeGreaterThanOrEqual(28);
    expect(all.filter((j) => j.tier === "green").length).toBeGreaterThanOrEqual(8);
    expect(all.filter((j) => j.tier === "amber").length).toBeGreaterThanOrEqual(10);
    expect(all.filter((j) => j.tier === "red").length).toBeGreaterThanOrEqual(6);
    for (const job of all) {
      expect(job.id, job.title).toMatch(/^[a-z0-9-]+$/);
      expect(job.blurb.length, job.title).toBeGreaterThan(10);
      if (job.diagram) expect(DIAGRAM_LABELS[job.diagram], job.title).toBeDefined();
    }
  });

  it("gives every RED job a refusal with a price and no procedure, and no AMBER or GREEN job one", () => {
    for (const job of all) {
      if (job.tier === "red") {
        expect(job.refusal, job.title).toBeDefined();
        expect(job.refusal!.why.length, job.title).toBeGreaterThanOrEqual(1);
        expect(job.refusal!.professional.priceGbp.min, job.title).toBeGreaterThan(0);
        expect(job.refusal!.professional.priceGbp.max, job.title).toBeGreaterThanOrEqual(job.refusal!.professional.priceGbp.min);
        expect(job.refusal!.whatYouCanDo.length, job.title).toBeGreaterThanOrEqual(1);
        expect(isGuideable(job)).toBe(false);
        expect(job.baseTools, job.title).toEqual([]);
      } else {
        expect(job.refusal, job.title).toBeUndefined();
        expect(isGuideable(job)).toBe(true);
        expect(job.baseTools.length, job.title).toBeGreaterThan(0);
        expect(job.safety.requirements.length, job.title).toBeGreaterThan(0);
        expect(job.safety.acknowledgement.length, job.title).toBeGreaterThan(0);
      }
    }
  });

  it("makes every job that involves lifting the car demand axle stands", () => {
    const lifting = all.filter((j) => j.baseTools.some((t) => t.name.includes("axle stands")));
    expect(lifting.length).toBeGreaterThanOrEqual(8);
    for (const job of lifting) {
      expect(job.safety.requirements.join(" "), job.title).toMatch(/axle stands/i);
    }
  });

  it("states no torque, capacity or part-number figures anywhere in the catalogue", () => {
    for (const job of all) {
      const text = [
        job.blurb,
        ...job.baseTools.map((t) => `${t.name} ${t.why ?? ""}`),
        ...job.consumables.map((t) => `${t.name} ${t.why ?? ""}`),
        ...job.safety.dangers,
        ...job.safety.requirements,
        ...(job.promptNotes ?? []),
        ...(job.refusal ? [...job.refusal.why, job.refusal.professional.note, ...job.refusal.whatYouCanDo] : []),
      ].join(" ");
      expect(text, job.title).not.toMatch(/\d+\s?(nm|lb ?ft|litres? of)/i);
    }
  });

  it("only references MOT rules that exist", () => {
    const ruleIds = new Set(RULES.map((r) => r.id));
    for (const job of all) {
      for (const id of job.motRuleIds) expect(ruleIds.has(id), `${job.id} -> ${id}`).toBe(true);
    }
  });

  it("routes MOT items to the right job, front and rear", () => {
    expect(jobForDefect("brakes.pads_thin", { position: "front" })?.id).toBe("front-brake-pads");
    expect(jobForDefect("brakes.pads_thin", { position: "rear" })?.id).toBe("rear-brake-pads");
    expect(jobForDefect("brakes.pads_thin", null)?.id).toBe("front-brake-pads");
    expect(jobForDefect("brakes.disc_worn", { position: "front" })?.id).toBe("front-brake-discs-and-pads");
    expect(jobForDefect("brakes.disc_worn", { position: "rear" })).toBeNull();
    expect(jobForDefect("suspension.spring", null)?.tier).toBe("red");
    expect(jobForDefect("other.airbag", null)?.id).toBe("airbag-srs");
    expect(jobForDefect("visibility.wiper", null)?.id).toBe("wiper-blades");
    expect(jobForDefect(null, null)).toBeNull();
    expect(jobForDefect("nonsense.rule", null)).toBeNull();
  });

  it("filters jobs by fuel", () => {
    const plugs = JOBS["spark-plugs"];
    expect(jobAppliesToFuel(plugs, "petrol")).toBe(true);
    expect(jobAppliesToFuel(plugs, "diesel")).toBe(false);
    expect(jobAppliesToFuel(plugs, "unknown")).toBe(true);
    expect(jobAppliesToFuel(JOBS["hybrid-ev-high-voltage"], "petrol")).toBe(false);
    expect(jobAppliesToFuel(JOBS["hybrid-ev-high-voltage"], "electric")).toBe(true);
    expect(jobAppliesToFuel(JOBS["wiper-blades"], "diesel")).toBe(true);
  });

  it("groups by system in catalogue order", () => {
    const groups = jobsBySystem();
    expect(groups[0].system).toBe("brakes");
    expect(groups.at(-1)?.system).toBe("safety_systems");
    expect(groups.flatMap((g) => g.jobs).length).toBe(all.length);
    expect(getJob("front-brake-pads")?.title).toBe("Front brake pads");
    expect(getJob("nope")).toBeNull();
  });
});
