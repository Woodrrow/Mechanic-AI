import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "./route";

const get = (qs: string) => GET(new NextRequest(`http://localhost/api/guides?${qs}`));

describe("GET /api/guides", () => {
  it("returns the reviewed reference guide for the demo Focus", async () => {
    const res = await get("job=front-brake-pads&make=FORD&model=Focus&year=2015&engineCc=1596&fuel=petrol");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.guide?.id).toBe("front-brake-pads__ford__focus__2011-2018__1596__petrol");
    expect(body.job.tier).toBe("amber");
  });

  it("says so when there is no guide for the car", async () => {
    const body = await (await get("job=front-brake-pads&make=VOLKSWAGEN&model=Golf&year=2016&engineCc=1968&fuel=diesel")).json();
    expect(body).toMatchObject({ ok: true, guide: null, reason: "no_guide_for_vehicle" });
    const incomplete = await (await get("job=front-brake-pads&make=FORD&fuel=petrol")).json();
    expect(incomplete).toMatchObject({ ok: true, guide: null, reason: "vehicle_incomplete" });
  });

  it("rejects bad requests", async () => {
    expect((await get("make=FORD")).status).toBe(400);
    expect((await get("job=nope&make=FORD")).status).toBe(404);
  });
});
