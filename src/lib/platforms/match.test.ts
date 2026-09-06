import { describe, expect, it } from "vitest";
import { JOBS } from "@/lib/jobs/catalogue";
import type { GuideRecord } from "@/lib/jobs/guide-schema";
import { loadGuides } from "@/lib/jobs/guide-schema.test";
import { describeSibling, findMemberships, findSiblingGuide, guideMemberships, resolveGuide } from "./match";

const guides = loadGuides();
const focusGuide = guides.find((g) => g.jobId === "front-brake-pads")!;
const golfWiperGuide = guides.find((g) => g.jobId === "wiper-blades")!;

const pads = JOBS["front-brake-pads"];
const wipers = JOBS["wiper-blades"];

describe("findMemberships", () => {
  it("places cars on their platform generation", () => {
    expect(findMemberships("FORD", "FOCUS ZETEC", 2015)[0]?.platform.id).toBe("ford-global-c");
    expect(findMemberships("FORD", "FOCUS", 2020)[0]?.platform.id).toBe("ford-c2-2018");
    expect(findMemberships("VOLKSWAGEN", "GOLF SE TSI BLUEMOTION TECHNOLOGY", 2016)[0]?.platform.id).toBe("vag-mqb");
    expect(findMemberships("AUDI", "A3 S LINE TDI", 2016)[0]?.platform.id).toBe("vag-mqb");
    expect(findMemberships("SKODA", "OCTAVIA SE L TSI", 2017)[0]?.platform.id).toBe("vag-mqb");
    expect(findMemberships("VOLKSWAGEN", "GOLF", 2008)[0]?.platform.id).toBe("vag-pq35");
  });

  it("is empty for cars it does not know and for incomplete vehicles", () => {
    expect(findMemberships("FERRARI", "F40", 1990)).toEqual([]);
    expect(findMemberships("FORD", null, 2015)).toEqual([]);
    expect(findMemberships("FORD", "FOCUS", null)).toEqual([]);
    expect(findMemberships("FORD", "FOCUS", 2000)).toEqual([]);
  });

  it("does not confuse similar model names", () => {
    expect(findMemberships("VOLKSWAGEN", "GOLF PLUS", 2016)).toEqual([]);
    expect(findMemberships("CITROEN", "C4 PICASSO", 2021).map((m) => m.platform.id)).not.toContain("psa-cmp");
    expect(findMemberships("TOYOTA", "YARIS CROSS", 2022)[0]?.member.name).toBe("Yaris Cross");
    expect(findMemberships("TOYOTA", "YARIS", 2022)[0]?.member.name).toBe("Yaris (XP210)");
  });

  it("matches a guide's scope to its platform", () => {
    expect(guideMemberships(focusGuide)[0]?.platform.id).toBe("ford-global-c");
    expect(guideMemberships(golfWiperGuide)[0]?.platform.id).toBe("vag-mqb");
  });
});

describe("findSiblingGuide", () => {
  const audiA3 = { jobId: "wiper-blades", makeRaw: "AUDI", model: "A3 SPORT TDI", year: 2016, engineCc: 1968, fuel: "diesel" };

  it("offers an MQB guide to another MQB car and names both", () => {
    const match = findSiblingGuide(audiA3, wipers, guides)!;
    expect(match.guide.id).toBe(golfWiperGuide.id);
    expect(match.platform.name).toBe("Volkswagen Group MQB");
    expect(match.vehicleMember).toBe("A3 (8V)");
    expect(match.guideMember).toBe("Golf Mk7");
    expect(match.engineDiffers).toBe(false);
    expect(describeSibling(match, "2016 Audi A3")).toContain("Golf Mk7");
    expect(describeSibling(match, "2016 Audi A3")).toContain("Volkswagen Group MQB");
  });

  it("still offers a non-engine-sensitive guide when the engine differs, and flags it", () => {
    const petrolSeat = { ...audiA3, makeRaw: "SEAT", model: "LEON FR TSI", engineCc: 1395, fuel: "petrol" };
    const match = findSiblingGuide(petrolSeat, wipers, guides)!;
    expect(match.guideMember).toBe("Golf Mk7");
    expect(match.engineDiffers).toBe(true);
  });

  it("refuses a sibling for an engine-sensitive job when the engine differs", () => {
    const oil = JOBS["engine-oil-and-filter"];
    const petrolSeat = { jobId: oil.id, makeRaw: "SEAT", model: "LEON", year: 2016, engineCc: 1395, fuel: "petrol" };
    const oilGuide: GuideRecord = {
      ...golfWiperGuide,
      id: "oil-golf",
      jobId: oil.id,
      scope: { ...golfWiperGuide.scope, engineCc: 1968, fuel: "diesel" },
    };
    expect(findSiblingGuide(petrolSeat, oil, [oilGuide])).toBeNull();
    const dieselSkoda = { ...petrolSeat, makeRaw: "SKODA", model: "OCTAVIA", engineCc: 1968, fuel: "diesel" };
    expect(findSiblingGuide(dieselSkoda, oil, [oilGuide])?.guide.id).toBe("oil-golf");
  });

  it("does not cross platforms or generations", () => {
    const mk8Golf = { jobId: "wiper-blades", makeRaw: "VOLKSWAGEN", model: "GOLF", year: 2022, engineCc: 1968, fuel: "diesel" };
    expect(findSiblingGuide(mk8Golf, wipers, guides)).toBeNull();
    const focusMk4 = { jobId: "front-brake-pads", makeRaw: "FORD", model: "FOCUS", year: 2020, engineCc: 1000, fuel: "petrol" };
    expect(findSiblingGuide(focusMk4, pads, guides)).toBeNull();
  });

  it("never offers a draft guide", () => {
    const draft: GuideRecord = { ...golfWiperGuide, id: "draft", status: "draft" };
    const audi = { jobId: "wiper-blades", makeRaw: "AUDI", model: "A3", year: 2016, engineCc: 1968, fuel: "diesel" };
    expect(findSiblingGuide(audi, wipers, [draft])).toBeNull();
  });
});

describe("resolveGuide", () => {
  it("prefers the exact guide over a sibling", () => {
    const focus = { jobId: "front-brake-pads", makeRaw: "FORD", model: "FOCUS ZETEC", year: 2015, engineCc: 1596, fuel: "petrol" };
    const resolution = resolveGuide(focus, pads, guides);
    expect(resolution.kind).toBe("exact");
    if (resolution.kind !== "exact") return;
    expect(resolution.guide.id).toBe(focusGuide.id);
  });

  it("falls back to a sibling, then to nothing", () => {
    const skoda = { jobId: "wiper-blades", makeRaw: "SKODA", model: "OCTAVIA SE", year: 2017, engineCc: 1598, fuel: "diesel" };
    expect(resolveGuide(skoda, wipers, guides).kind).toBe("sibling");
    const kia = { jobId: "wiper-blades", makeRaw: "KIA", model: "CEED", year: 2019, engineCc: 1400, fuel: "petrol" };
    expect(resolveGuide(kia, wipers, guides).kind).toBe("none");
  });
});
