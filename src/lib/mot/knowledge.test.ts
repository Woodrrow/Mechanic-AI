import { describe, expect, it } from "vitest";
import { REGISTRATION_FIXTURES } from "@/lib/providers/fixtures";
import { explainDefect, RULES } from "./knowledge";
import { parseDefect } from "./parse";

function explain(text: string, type = "ADVISORY") {
  return explainDefect(parseDefect(text, type));
}

describe("knowledge rules", () => {
  it.each([
    ["Front Brake pad(s) wearing thin (1.1.13 (a) (ii))", "brakes.pads_thin", "Replace front brake pads"],
    ["Offside Rear Brake pad(s) wearing thin (3.5.1g)", "brakes.pads_thin", "Replace rear brake pads"],
    ["Front Brake disc worn, pitted or scored, but not seriously weakened (1.1.14 (a) (ii))", "brakes.disc_worn", "Replace front brake discs and pads"],
    ["Nearside Front Tyre worn close to legal limit/worn on edge (5.2.3 (e))", "tyres.near_limit", "Check the tread and replace the tyre"],
    ["Nearside Front Tyre worn close to the legal limit (4.1.E.1)", "tyres.near_limit", "Check the tread and replace the tyre"],
    ["Oil leak, but not excessive (8.4.1 (a) (i))", "nuisance.oil_leak", "Find the leak and keep the oil topped up"],
    ["Nearside Front Suspension arm ball joint has excessive play (5.3.4 (a) (i))", "suspension.joint", "Replace front suspension arm or ball joint"],
    ["Offside Front Headlamp aim too high (4.1.2 (a))", "lamps.headlamp_aim", "Adjust the headlamp aim"],
    ["Windscreen wiper blade defective, not clearing the screen (3.4 (b) (i))", "visibility.wiper", "Replace the wiper blades"],
    ["Exhaust has a minor leak of exhaust gases (7.1.2)", "body.exhaust", "Replace the exhaust section or mounting"],
    ["Nearside Front Shock absorber has light misting of oil (5.3.2 (b))", "suspension.shock", "Replace front shock absorbers in pairs"],
    ["Offside Front Coil spring corroded (5.3.1 (b) (i))", "suspension.spring", "Replace coil springs"],
    ["Nearside Front Anti-roll bar linkage ball joint has slight play (5.3.4 (a) (i))", "suspension.arb", "Replace anti-roll bar drop links or bushes"],
    ["Offside Front Track rod end ball joint has slight play (2.1.3 (b) (i))", "steering.joint", "Replace front track rod end or rack gaiter"],
    ["Nearside Rear Position lamp not working (4.2.1 (a) (ii))", "lamps.bulb", "Replace the bulb or lamp unit"],
    ["Battery insecure (4.13 (a) (i))", "lamps.battery", "Secure the battery and clean the terminals"],
    ["Nearside sill corroded within a prescribed area but not seriously weakened (6.1.1 (c) (i))", "body.structural_corrosion", "Structural rust repair"],
    ["Front subframe corroded but not seriously weakened (5.3.6 (a) (i))", "suspension.corrosion", "Have the corrosion assessed"],
    ["Rear Brake pipe slightly corroded (1.1.11 (c))", "brakes.pipe_hose", "Replace brake pipe or hose"],
    ["Driver's seat belt webbing slightly frayed (7.1.2 (a))", "other.seatbelt", "Replace the seat belt"],
    ["Exhaust emissions carbon monoxide content at idle excessive (8.2.1.2 (a))", "nuisance.emissions", "Emissions diagnosis"],
  ])("%s -> %s", (text, ruleId, jobName) => {
    const e = explain(text);
    expect(e.ruleId).toBe(ruleId);
    expect(e.job?.name).toBe(jobName);
  });

  it("uses the safety tiers from the brief", () => {
    expect(explain("Front Brake pad(s) wearing thin (1.1.13 (a) (ii))").job?.tier).toBe("amber");
    expect(explain("Windscreen wiper blade defective (3.4 (b) (i))").job?.tier).toBe("green");
    expect(explain("Offside Front Coil spring fractured (5.3.1 (b) (ii))").job?.tier).toBe("red");
    expect(explain("Airbag warning lamp indicates a fault (7.1.5 (a))").job?.tier).toBe("red");
    expect(explain("Fuel leak from fuel pipe (6.1.3 (b))").job?.tier).toBe("red");
  });

  it("never invents a note for unknown items", () => {
    const e = explain("Nearside Front Widget bracket slightly deformed (6.1.9 (b))");
    expect(e.ruleId).toBeNull();
    expect(e.title).toBe("Widget bracket slightly deformed");
    expect(e.job).toBeNull();
    expect(e.meaning).toMatch(/shown as written/);
    expect(e.whyItMatters).toContain("6.1.9 (b)");
  });

  it("explains every defect in the fixtures", () => {
    const texts = Object.values(REGISTRATION_FIXTURES)
      .flatMap((f) => f.mot?.motTests ?? [])
      .flatMap((t) => t.defects ?? [])
      .map((d) => d.text);
    expect(texts.length).toBeGreaterThan(10);
    for (const text of texts) expect(explain(text).ruleId, text).not.toBeNull();
  });

  it("has unique rule ids and no rule that states a figure", () => {
    const ids = RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of RULES) {
      const text = `${r.meaning} ${r.whyItMatters} ${r.job.summary}`;
      expect(text, r.id).not.toMatch(/\d+\s?(nm|n·m|newton|lb ?ft|litres? of|ml\b)/i);
    }
  });
});
