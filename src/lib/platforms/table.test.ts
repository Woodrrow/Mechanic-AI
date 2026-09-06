import { describe, expect, it } from "vitest";
import { PLATFORMS } from "./table";

describe("platform table", () => {
  it("has unique ids and sane members", () => {
    const ids = PLATFORMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const platform of PLATFORMS) {
      expect(platform.members.length, platform.id).toBeGreaterThanOrEqual(1);
      for (const member of platform.members) {
        expect(member.make, `${platform.id} ${member.name}`).toBe(member.make.toUpperCase());
        expect(member.yearFrom, `${platform.id} ${member.name}`).toBeLessThanOrEqual(member.yearTo);
        expect(member.yearFrom).toBeGreaterThan(1990);
        expect(member.yearTo).toBeLessThan(2030);
        expect(member.model.flags, `${platform.id} ${member.name} must be case-sensitive against upper-case input`).not.toContain("i");
      }
    }
  });

  it("never puts the same make, model and year in two platforms", () => {
    const seen = new Map<string, string>();
    for (const platform of PLATFORMS) {
      for (const member of platform.members) {
        for (let year = member.yearFrom; year <= member.yearTo; year++) {
          const key = `${member.make}|${member.name}|${year}`;
          const previous = seen.get(key);
          expect(previous, `${key} in ${platform.id} and ${previous}`).toBeUndefined();
          seen.set(key, platform.id);
        }
      }
    }
  });

  it("covers a decent share of the UK fleet", () => {
    const makes = new Set(PLATFORMS.flatMap((p) => p.members.map((m) => m.make)));
    for (const make of ["FORD", "VOLKSWAGEN", "VAUXHALL", "TOYOTA", "NISSAN", "BMW", "AUDI", "MERCEDES-BENZ", "KIA", "HYUNDAI", "PEUGEOT", "RENAULT"]) {
      expect(makes.has(make), make).toBe(true);
    }
    expect(PLATFORMS.flatMap((p) => p.members).length).toBeGreaterThan(120);
  });
});
