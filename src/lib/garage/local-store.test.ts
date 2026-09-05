import { beforeEach, describe, expect, it } from "vitest";
import type { VehicleCore } from "@/lib/vehicle/types";
import { LocalGarageStore } from "./local-store";

const core: VehicleCore = {
  country: "GB",
  registration: "AB15CDE",
  vin: null,
  make: "Ford",
  makeRaw: "FORD",
  model: "Focus",
  year: 2015,
  engineCc: 1596,
  fuel: "petrol",
  transmission: "manual",
  colour: "Blue",
  uk: null,
  provenance: [],
  sources: {},
};

function stubWindow() {
  const data = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
  (globalThis as unknown as { window: unknown }).window = { localStorage };
}

describe("LocalGarageStore", () => {
  beforeEach(stubWindow);

  it("adds, lists, updates and removes", async () => {
    const store = new LocalGarageStore();
    expect(await store.list()).toEqual([]);
    const saved = await store.add(core);
    expect(saved.id).toBeTruthy();
    expect((await store.get(saved.id))?.model).toBe("Focus");

    const updated = await store.update(saved.id, { engineCc: 1600, sources: { fetchedAt: "2026-09-05T00:00:00Z" } });
    expect(updated.engineCc).toBe(1600);
    expect(updated.id).toBe(saved.id);
    expect((await store.get(saved.id))?.sources.fetchedAt).toBe("2026-09-05T00:00:00Z");

    await store.remove(saved.id);
    expect(await store.list()).toEqual([]);
    await expect(store.update(saved.id, {})).rejects.toThrow(/no longer/);
  });

  it("survives corrupt storage", async () => {
    window.localStorage.setItem("pocket-mechanic.garage.v1", "{not json");
    expect(await new LocalGarageStore().list()).toEqual([]);
  });
});
